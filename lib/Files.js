////////////////////////////////////////////////////////////
//
// Files
//
// File system controller. Handles all aspects pertaining to
// the file system, including initial route creation and
// file system watching for updates.
//
////////////////////////////////////////////////////////////

import fs from 'fs'
import path from 'path'
import chokidar from 'chokidar'
import polka from 'polka'
import serveStaticMiddleware from 'sirv'

import JSDB from '@small-tech/jsdb'

import { BroadcastChannel } from 'worker_threads'

export default class Files {
  app
  basePath
  watcher
  filesByExtension
  routes

  broadcastChannel

  static HTTP_METHODS = ['get', 'head', 'patch', 'options', 'connect', 'delete', 'trace', 'post', 'put']
  static timeCounter = 0

  constructor (basePath = process.cwd()) {

    this.routes = {}
    this.filesByExtension = {}

    this.broadcastChannel = new BroadcastChannel('loader-and-main-process')
    this.broadcastChannel.onmessage = event => {
      console.log(`[Main process broadcast channel] Received contents of route`, event.data.route)
      this.routes[event.data.route] = event.data.contents
    }

    // Ensure database is ready
    // TODO: Keep the database elsewhere.
    globalThis.db = JSDB.open('.db')

    // You can place your source files either in the project
    // folder directly or in a subfolder called src.
    const srcFolder = path.join(basePath, 'src')
    this.basePath = fs.existsSync(srcFolder) ? srcFolder : basePath

    // Set the basePath as an environment variable so the ESM Module Loader
    // can access it also. It can use it to ensure that it saves the route
    // cache for compiled Svelte files using the same route key that we’re
    // using. (The loader otherwise cannot know what basePath was supplied.)
    process.env.basePath = this.basePath

    // Create the app.
    this.app = polka()
  }

  async initialise () {
    return new Promise((resolve, reject) => {
      // console.time(`Files ${++Files.timeCounter}`)

      const watcherGlob = `${this.basePath}/**/*.@(page|socket|${Files.HTTP_METHODS.join('|')})`
      const watcherOptions = {
        // Emit events when initially discovering files.
        ignoreInitial: false,
        ignored: /(^|[\/\\])\..|node_modules|#static/ // ignore dotfiles/dotfolders as well as the node_modules and #static folders
      }

      this.watcher =
      chokidar
        .watch(watcherGlob, watcherOptions)
        .on('ready', async () => {
          // console.timeEnd(`Files ${Files.timeCounter}`)

          // For now.
          await this.createRoutes()

          resolve(this.filesByExtension)
        })
        .on('add', (filePath, stats) => {
          const extension = path.extname(filePath).replace('.', '')
          if (!this.filesByExtension[extension]) {
            this.filesByExtension[extension] = []
          }
          this.filesByExtension[extension].push(filePath)
        })
        .on('error', async error => {
          await this.watcher.close()
          reject(error)
        })
    })
  }

  async close() {
    await this.watcher.close()
  }

  // Create the routes and add them to the server.
  // The ESM Loaders will automatically handle any processing that needs to
  // happen during the import process.
  async createRoutes () {

    const supportedExtensions = `\.(page|socket|${Files.HTTP_METHODS.join('|')})$`
    const indexWithExtensionRegExp = new RegExp(`index${supportedExtensions}`)
    const extensionRegExp = new RegExp(supportedExtensions)

    Object.keys(this.filesByExtension).forEach(extension => {
      const filesOfType = this.filesByExtension[extension]
      // // HTTP methods
      // if (Files.HTTP_METHODS.includes(extension)) {
        filesOfType.forEach(async filePath => {
          // TODO: Move this into a shared utility class that’s imported
          // both here and in the loader.
          // Transform an absolute file system path to a web server route.
          const route = filePath
            .replace(this.basePath, '')             // Remove the base path.
            .replace(/_/g, '/')                     // Replace underscores with slashes.
            .replace(/\[(.*?)\]/g, ':$1')           // Replace properties. e.g., [prop] becomes :prop
            .replace(indexWithExtensionRegExp, '')  // Remove index path fragments (and their extensions)
            .replace(extensionRegExp, '')           // Remove extension.

            // TODO: Implement support for web socket routes.
            // For now, let’s just ignore them.
            if (extension === 'socket') {
              console.warn('[FILES] Ignoring WebSocket route for now.', filePath)
              return
            }

            const httpMethod = Files.HTTP_METHODS.includes(extension) ? extension : 'get'

            const handlerRaw = (await import(filePath)).default

            let handler
            if (handlerRaw.render) {
              // This is a svelte page. Create a custom route to serve it.

              console.log('[FILES] Attempting to get route cache for route', route)
              const routeCache = this.routes[route]
              const nodeScript = routeCache.nodeScript
              const hydrationScript = routeCache.hydrationScript

              // console.log('>> routeCache', routeCache)

              handler = async (request, response) => {

                console.log('>>>>> PAGE HANDLER <<<<<')

                console.time('Request')
                console.time('  ╭─ Node script execution (initial data)')
                // Run the nodeScript if it exists
                const data = nodeScript ? await nodeScript(request) : undefined
                console.timeEnd('  ╭─ Node script execution (initial data)')

                console.time('  ├─ Page render (html + css)')
                // Render the page, passing the server-side data as a property.
                const { html, css } = handlerRaw.render({data})
                console.timeEnd('  ├─ Page render (html + css)')

                console.time('  ├─ Final HTML render')
                const finalHtml = `
                <!DOCTYPE html>
                  <html lang='en'>
                  <head>
                    <meta charset='UTF-8'>
                    <meta http-equiv='X-UA-Compatible' content='IE=edge'>
                    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                    <link rel="icon" href="data:,">
                    <title>Document</title>
                    <style>${css.code}</style>
                  </head>
                  <body>
                      <div id='app'>
                        ${html}
                      </div>
                      <script type='module'>
                      ${hydrationScript}

                      // TODO: Note: class name will be different for each page.
                      // =========== This is currently hardcoded.
                      new Src({
                        target: document.getElementById('app'),
                        hydrate: true,
                        props: {
                          data: ${JSON.stringify(data)}
                        }
                      })
                  </script>
                  </body>
                  </html>
                `
                console.timeEnd('  ├─ Final HTML render')

                console.time('  ├─ Response send')
                response.end(finalHtml)
                console.timeEnd('  ├─ Response send')

                console.timeEnd('Request')
              }
            } else {
              // This is a non-svelte route. It is expected to export the function
              // itself so we can just use it as the route handler.
              handler = handlerRaw
            }
            // TODO: Handle error condition.

            console.log('Adding route:', httpMethod, route, filePath, handler)

            // TODO: LEFT OFF HERE
            // This is where we need to check if a the path is a page, and, if so,
            // write out a route that loads the route from the JSDB cache, etc.,
            // See server.js in svelte-esm-loader-experimental spike for how to do
            // this.
            this.app[httpMethod](route, (await import(filePath)).default)

            console.log(this.app.routes.forEach(route => console.log(route.handlers)))
        })
      // }
    })

    // TODO: Move these elsewhere! This is just to get things up and running for now.
    this.app.use(serveStaticMiddleware(path.join(this.basePath, '#static')))
    this.app.listen(3000)
  }
}
