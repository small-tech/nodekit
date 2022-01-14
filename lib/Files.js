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

export default class Files {
  app
  basePath
  watcher
  filesByExtension

  static HTTP_METHODS = ['get', 'head', 'patch', 'options', 'connect', 'delete', 'trace', 'post', 'put']
  static timeCounter = 0

  constructor (basePath = process.cwd()) {
    this.filesByExtension = {}

    // You can place your source files either in the project
    // folder directly or in a subfolder called src.
    const srcFolder = path.join(basePath, 'src')
    this.basePath = fs.existsSync(srcFolder) ? srcFolder : basePath

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

            console.log('Adding route:', httpMethod, route)

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
