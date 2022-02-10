////////////////////////////////////////////////////////////
//
// NodeKit
//
// Copyright ⓒ 2021-present, Aral Balkan
// Small Technology Foundation
//
// License: AGPL version 3.0.
//
////////////////////////////////////////////////////////////

// Conditional logging.
console.verbose = process.env.VERBOSE ? function () { console.log(...arguments) } : () => {}
console.profileTime = process.env.PROFILE ? function () { console.time(...arguments) } : () => {}
console.profileTimeEnd = process.env.PROFILE ? function () { console.timeEnd(...arguments) } : () => {}

console.verbose('------------------- MAIN PROCESS START ----------------------')

import os from 'os'
import vm from 'vm'
import esbuild from 'esbuild'
import { _findPath } from 'module'
import fs from 'fs'
import path from 'path'
import childProcess from 'child_process'

import chokidar from 'chokidar'
import polka from 'polka'

import { fetch } from 'undici'

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

// class Handler {
//   _handler
//   _ready
//   _beingLoaded

//   async function ready () {
//     if (!_beingLoaded) return true
//     return new Promise((resolve, reject) => {
//       // LEFT OFF HERE.
//       // Need a way to wait on multiple accesses to a route
//       // If it is being loaded/rendered.
//     })
//   }
// }

export default class NodeKit {
  app
  server
  context
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
      console.verbose(`[Main process broadcast channel] Received contents of route`, event.data.route)
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

    // Create a separate context for each route but do this when the route
    // is being created so that any values set on the route survive future
    // calls to the route.
    this.context = vm.createContext({
      // NodeKit globals.
      db: globalThis.db,
      // Node.js globals.
      console, URLSearchParams, URL, process,
      // (Fetch is part of undici right now but slated to be part
      // of Node 16 under an experimental flag and Node 18 without.
      // Once that lands, we can replace this with the standard
      // implementation.)
      fetch
    })
  }

  async initialise () {
    return new Promise((resolve, reject) => {
      // console.profileTime(`Files ${++Files.profileTimeCounter}`)

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
          // console.profileTimeEnd(`Files ${Files.profileTimeCounter}`)

          // For now.
          await this.createRoutes()

          // Create development socket.
          this.createDevelopmentSocket()

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
    // if (this.initialised) {
    //   console.verbose(`${itemType.charAt(0).toUpperCase()+itemType.slice(1)} ${eventType} (${itemPath}), asking for restart.`)
    //   process.exit(1)
    // }
    // console.warn('[handleRestartIfNeededFor]', itemPath, 'ignoring', 'under dev')
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
        console.verbose(' 😇 ❨NodeKit❩ Linux: about to disable privileged ports so we can bind to ports < 1024.')
        console.verbose('    ❨NodeKit❩ For details, see: https://source.small-tech.org/site.js/app/-/issues/169')

        childProcess.execSync('sudo sysctl -w net.ipv4.ip_unprivileged_port_start=0', {env: process.env})
      } catch (error) {
        console.error(`\n ❌ ❨NodeKit❩ Error: Could not disable privileged ports. Cannot bind to port 80 and 443. Exiting.`, error)
        process.exit(1)
      }
    }
  }

  // Creates a WebSocket at /.well-known/dev used for hot module reloading, etc., during
  // development time.
  createDevelopmentSocket () {
    // console.info('Creating dev socket')
    const devSocket = new WebSocketRoute((socket, request, response) => {
      // console.info('[DEV SOCKET] New connection')
      // Test
      // setTimeout(() => {
      //   socket.send(JSON.stringify({ type: 'reload' }))
      // }, 5000)
    })

    this.app.get('/.well-known/dev', devSocket.handler.bind(devSocket))
  }

  async createRoute (filePath) {
    const routes = this.routes
    const basePath = this.basePath
    const context = this.context

    const route = routeFromFilePath(filePath)
    const extension = path.extname(filePath).replace('.', '')
    const httpMethod = HTTP_METHODS.includes(extension) ? extension : 'get'

    console.verbose('[FILES] Creating route', route, extension)

    // Handlers will lazy-load their content the first time they are hit so
    // what we really have is one meta-handler for every route that decides
    // what to load at runtime.
    const handler = (async function (request, response) {
      if (extension === 'socket') {
        //
        // WebSocket route.
        //
        if (this._handler === undefined) {
          console.verbose('[Handler] Lazy loading WebSocket route', route)
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
          console.verbose('[Handler] Lazy loading route', route)
          const handlerRaw = (await import(filePath)).default

          if (handlerRaw.render) {
            // This is a NodeKit page. Create a custom route to serve it.
            // console.log('[Handler] Attempting to get route cache for route', route)
            const routeCache = routes[route]
            const hydrationScript = routeCache.hydrationScript

            // This is the same class name that was set by the hydration script compiler
            // in the module loader.
            let className = classNameFromRoute(route)

            this._handler = async (request, response) => {
              console.verbose('[Page Handler]', route, className)
              console.profileTime('  ╰─ Total')
              console.profileTime('  ╭─ Node script execution (initial data)')

              // Run NodeScript module (if any) in its own V8 Virtual Machine context.
              let data = undefined

              if (routeCache.nodeScript) {
                // Cache the nodeScript.
                // TODO: Update cache if source changes.
                if (!routeCache.nodeScriptHandler) {
                  // Using esbuild
                  let buildResult
                  try {
                    buildResult = await esbuild.build({
                      stdin: {
                        contents: routeCache.nodeScript,
                        resolveDir: basePath,
                        sourcefile: 'node-script.js',
                        loader: 'js'
                      },
                      bundle: true,
                      format: 'esm',
                      platform: 'node',
                      write: false
                    })
                  } catch (error) {
                    console.error(error)
                    response.statusCode = 500
                    response.end(error.stack.toString())
                  }
                  const bundle = buildResult.outputFiles[0].text

                  // TODO: Implement cache using sourceTextModule.createCachedData()
                  const module = new vm.SourceTextModule(bundle, { context })

                  await module.link(async (specifier, referencingModule) => {
                    // throw new Error(`[LINKER] Bundle should not have any imports but received ${specifier} from ${referencingModule}`)

                    return new Promise(async (resolve, reject) => {
                      console.verbose('Linking: ', specifier)

                      const module = await import(specifier)
                      const exportNames = Object.keys(module)

                      // In order to interoperate with Node’s own ES Module Loader,
                      // we have to resort to creating a synthetic module to
                      // translate for us.
                      //
                      // Thanks to László Szirmai for the tactic
                      // (https://github.com/nodejs/node/issues/35848).
                      const syntheticModule = new vm.SyntheticModule(
                        exportNames,
                        function () {
                          exportNames.forEach(key => {
                            this.setExport(key, module[key])
                        })
                      }, { context })

                      resolve(syntheticModule)
                    })
                  })

                  // Evaluate the module. After successful completion of this step,
                  // the module is available from the module.namespace reference.
                  await module.evaluate()

                  routeCache.nodeScriptHandler = module.namespace.default
                }

                // Run the nodeScript.
                data = await routeCache.nodeScriptHandler(request, response)
              }

              console.profileTimeEnd('  ╭─ Node script execution (initial data)')

              console.profileTime('  ├─ Page render (html + css)')
              // Render the page, passing the server-side data as a property.
              const { html, css } = handlerRaw.render({data})
              console.profileTimeEnd('  ├─ Page render (html + css)')

              console.profileTime('  ├─ Final HTML render')
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
                ${
                  process.env.PRODUCTION ? '' : `
                  <script>
                    // Development socket connection.
                    const __devSocket = new WebSocket('wss://localhost/.well-known/dev')
                    __devSocket.addEventListener('message', event => {
                      const message = JSON.parse(event.data)
                      if (message.type === 'reload') {
                        // For now, just test a reload
                        window.location.reload(true)
                      }
                    })
                  </script>
                  `
                }
                </body>
                </html>
              `
              console.profileTimeEnd('  ├─ Final HTML render')

              console.profileTime('  ├─ Response send')
              response.end(finalHtml)
              console.profileTimeEnd('  ├─ Response send')

              console.profileTimeEnd('  ╰─ Total')
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
      console.info(`⬢ NodeKit\n\n  💾 ${this.basePath}\n  🌍 https://${this.hostname}\n`)
    })
  }
}
