////////////////////////////////////////////////////////////
//
// Files
//
// File system controller. Handles all aspects pertaining to
// the file system, including initial route creation and
// file system watching for updates.
//
////////////////////////////////////////////////////////////

console.log('------------------- MAIN PROCESS START ----------------------')

import os from 'os'
import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import childProcess from 'child_process'

import chokidar from 'chokidar'
import polka from 'polka'

// Temporarily using my own fork where sirv only responds to GET requests that
// are not WebSocket requests (so as not to mask POST, WebSocket, etc., requests
// that may be on the same path).
import serveStaticMiddleware from '@small-tech/sirv'

import https from '@small-tech/https'

import { tinyws } from 'tinyws'
import WebSocketRoute from './lib/WebSocketRoute'

import { classNameFromRoute, routeFromFilePath, HTTP_METHODS } from './lib/Utils'

import { fileURLToPath, URL } from 'url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))

import JSDB from '@small-tech/jsdb'

import { BroadcastChannel } from 'worker_threads'

export default class Files {
  app
  server
  basePath
  watcher
  filesByExtension
  hostname
  options
  routes
  initialised = false

  broadcastChannel

  static timeCounter = 0

  constructor (basePath = process.cwd()) {

    // Ensure database is ready
    // TODO: Keep the database elsewhere outside of the project folder structure. It’s too easy
    // ===== to accidentally upload it somewhere otherwise by messing up your .gitignore (security).
    globalThis.db = JSDB.open(path.join(basePath, '.db'))

    this.routes = {}
    this.filesByExtension = {}

    this.hostname = os.hostname()

    // TODO: Remove + implement proper logic to decide localhost vs hostname usage.
    // DEBUG: hardcode to localhost for now.
    this.hostname = 'localhost'

    this.options = { domains: [this.hostname] }

    this.broadcastChannel = new BroadcastChannel('loader-and-main-process')
    this.broadcastChannel.onmessage = event => {
      console.log(`[Main process broadcast channel] Received contents of route`, event.data.route)
      this.routes[event.data.route] = event.data.contents
    }

    // You can place your source files either in the project
    // folder directly or in a subfolder called src.
    const srcFolder = path.join(basePath, 'src')
    this.basePath = fs.existsSync(srcFolder) ? srcFolder : basePath

    // Set the basePath as an environment variable so the ESM Module Loader
    // can access it also. It can use it to ensure that it saves the route
    // cache for compiled Svelte files using the same route key that we’re
    // using. (The loader otherwise cannot know what basePath was supplied.)
    process.env.basePath = this.basePath

    // Disable privileged ports on Linux (because we don’t need security
    // theatre to trip us up.)
    this.ensurePrivilegedPortsAreDisabled()

    // Create the app.
    this.app = polka()

    // Add the WebSocket server.
    this.app.use(tinyws())
  }

  async initialise () {
    return new Promise((resolve, reject) => {
      // console.time(`Files ${++Files.timeCounter}`)

      const watcherGlob = `${this.basePath}/**/*.@(page|socket|${HTTP_METHODS.join('|')})`
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

          this.initialised = true

          resolve(this.filesByExtension)
        })
        .on('add', (filePath, stats) => {
          this.handleRestartIfNeededFor('file', 'added', filePath)

          const extension = path.extname(filePath).replace('.', '')
          if (!this.filesByExtension[extension]) {
            this.filesByExtension[extension] = []
          }
          this.filesByExtension[extension].push(filePath)
        })
        .on('change', filePath => { this.handleRestartIfNeededFor('file', 'added', filePath) })
        .on('unlink', filePath => { this.handleRestartIfNeededFor('file', 'unlinked', filePath) })
        .on('addDir', filePath => { this.handleRestartIfNeededFor('directory', 'added', filePath)})
        .on('unlinkDir', filePath => { this.handleRestartIfNeededFor('directory', 'unlinked', filePath) })
        .on('error', async error => {
          await this.watcher.close()
          reject(error)
        })
    })
  }

  handleRestartIfNeededFor(itemType, eventType, itemPath) {
    // If we’re already initialised, exit so we can be restarted.
    if (this.initialised) {
      console.log(`${itemType.charAt(0).toUpperCase()+itemType.slice(1)} ${eventType} (${itemPath}), asking for restart.`)
      process.exit(1)
    }
  }

  async close() {
    await this.watcher.close()
  }

  // Linux has an archaic security restriction dating from the mainframe/dumb-terminal era where
  // ports < 1024 are “privileged” and can only be connected to by the root process. This has no
  // practical security advantage today (and actually can lead to security issues). Instead of
  // bending over backwards and adding more complexity to accommodate this, we use a feature that’s
  // been in the Linux kernel since version 4.11 to disable privileged ports.
  //
  // As this change is not persisted between reboots and takes a trivial amount of time to
  // execute, we carry it out every time.
  //
  // For more details, see: https://source.small-tech.org/site.js/app/-/issues/169
  ensurePrivilegedPortsAreDisabled () {
    if (os.platform() === 'linux') {
      try {
        console.log(' 😇 ❨NodeKit❩ Linux: about to disable privileged ports so we can bind to ports < 1024.')
        console.log('    ❨NodeKit❩ For details, see: https://source.small-tech.org/site.js/app/-/issues/169')

        childProcess.execSync('sudo sysctl -w net.ipv4.ip_unprivileged_port_start=0', {env: process.env})
      } catch (error) {
        console.log(`\n ❌ ❨NodeKit❩ Error: Could not disable privileged ports. Cannot bind to port 80 and 443. Exiting.`, error)
        process.exit(1)
      }
    }
  }

  // Creates a WebSocket at /.well-known/dev used for hot module reloading, etc., during
  // development time.
  createDevelopmentSocket () {
    this.app['get']('/.well-known/dev', new WebSocketRoute((socket, request, response) => {
      // TEST
      setTimeout(() => {
        socket.broadcast({})
      })
    }))
  }

  async createRoute (filePath) {
    const routes = this.routes
    const basePath = this.basePath

    const route = routeFromFilePath(filePath)
    const extension = path.extname(filePath).replace('.', '')
    const httpMethod = HTTP_METHODS.includes(extension) ? extension : 'get'

    console.log('[FILES] Creating route', route, extension)

    // Handlers will lazy-load their content the first time they are hit so
    // what we really have is one meta-handler for every route that decides
    // what to load at runtime.
    const handler = (async function (request, response) {
      if (extension === 'socket') {
        //
        // WebSocket route.
        //
        if (this._handler === undefined) {
          console.log('[Handler] Lazy loading WebSocket route', route)
          const webSocketHandler = (await import(filePath)).default
          const webSocketRoute = new WebSocketRoute(webSocketHandler)
          this._handler = webSocketRoute.handler.bind(webSocketRoute)
        }
        return this._handler (request, response)
      } else {
        //
        // All other routes.
        //
        if (this._handler === undefined) {
          console.log('[Handler] Lazy loading route', route)
          const handlerRaw = (await import(filePath)).default

          if (handlerRaw.render) {
            // This is a svelte page. Create a custom route to serve it.
            // console.log('[Handler] Attempting to get route cache for route', route)
            const routeCache = routes[route]
            const hydrationScript = routeCache.hydrationScript

            // This is the same class name that was set by the hydration script compiler
            // in the module loader.
            let className = classNameFromRoute(route)

            this._handler = async (request, response) => {
              console.log('[Page Handler]', route, className)

              // Load the node script for the route and write it into a temporary file
              // so we can import it.
              // NOTE: We can just build a loader for this to load it from string. No need
              // to write to filesystem… but what about imports in the script, etc.?
              if (routeCache.nodeScript && this._nodeScript == undefined) {
                const dynamicModule = path.join(basePath, `${className}.${Date.now()}.script.tmp.mjs`)
                const relativePathToDynamicModule = path.relative(__dirname, dynamicModule)

                await fsPromises.writeFile(dynamicModule, routeCache.nodeScript)
                this._nodeScript = (await import(relativePathToDynamicModule)).default
                await fsPromises.unlink(dynamicModule)
              }

              console.time('  ╰─ Total')
              console.time('  ╭─ Node script execution (initial data)')
              // Run the nodeScript if it exists
              const data = this._nodeScript ? await this._nodeScript(request) : undefined

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
                    <div id='application'>
                      ${html}
                    </div>
                    <script type='module'>
                    ${hydrationScript}

                    new ${className}({
                      target: document.getElementById('application'),
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

              console.timeEnd('  ╰─ Total')
            }
          } else {
            // This is a non-svelte route. It is expected to export the function
            // itself so we can just use it as the route handler.
            this._handler = handlerRaw
          }
        }
        // Called the cached handler.
        await this._handler(request,response)
      }
    }).bind(new Object())

    // Add the route

    // console.log('[FILES] Adding route', httpMethod, route, filePath, handler)

    // Add handler to server.
    this.app[httpMethod](route, handler)

    // Debug: show state of handlers.
    // console.log(this.app.routes.forEach(route => console.log(route.handlers)))
  }



  // Create the routes and add them to the server.
  // The ESM Loaders will automatically handle any processing that needs to
  // happen during the import process.
  async createRoutes () {
    const extensions = Object.keys(this.filesByExtension)
    for await (const extension of extensions) {
      const filesOfType = this.filesByExtension[extension]
      for await (const filePath of filesOfType) {
        this.createRoute(filePath)
      }
    }

    // TODO: Move these elsewhere! This is just to get things up and running for now.
    const staticFolder = path.join(this.basePath, '#static')
    if (fs.existsSync(staticFolder)) {
      console.log('>>>> ADDDING STATIC MIDDLEWARE <<<<<<<')
      this.app.use('/', serveStaticMiddleware(staticFolder, {
        // TODO: Only turn on dev mode if not in PRODUCTION
        dev: true
      }))
    }

    // Get the handler from the Polka instance and create a secure site using it.
    // (Certificates are automatically managed by @small-tech/https).
    const { handler } = this.app

    this.server = https.createServer(this.options, handler)
    this.server.listen(443, () => {
      console.log(`  🎉 ❨NodeKit❩ Server running at https://${this.hostname}.`)
    })
  }
}
