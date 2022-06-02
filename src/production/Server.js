////////////////////////////////////////////////////////////
//
// Server (Production Mode)
//
// Copyright ⓒ 2021-present, Aral Balkan
// Small Technology Foundation
//
// License: AGPL version 3.0.
//
////////////////////////////////////////////////////////////

// Conditional logging.
console.verbose = process.env.VERBOSE ? function () { console.log(...arguments) } : () => {}

import os from 'os'
import fs from 'fs'
import path from 'path'
import { _findPath } from 'module'
import vm from 'vm'

import polka from 'polka'
import Routes from './Routes'
import { configurationPath } from './Utils'
import https from '@small-tech/https'
import JSDB from '@small-tech/jsdb'

// Temporarily using my own fork where sirv only responds to GET requests that
// are not WebSocket requests (so as not to mask POST, WebSocket, etc., requests
// that may be on the same path).
import { tinyws } from 'tinyws'

export default class Server extends EventTarget {
  constructor () {
    super()

    this.hostname = os.hostname()

    // TODO: Remove + implement proper logic to decide localhost vs hostname usage.
    // DEBUG: hardcode to localhost for now.
    this.hostname = 'localhost'

    this.options = { domains: [this.hostname] }

    // Create the app.
    const errorTemplate = `
      <h1>{CODE}</h1>
      <h2>{ERROR}</h2>
      <pre><code>{STACK}</code></pre>
      <style>
        body { font-family: sans-serif; font-size: 1.5em; padding: 1em 2em; }
        h1 { color: red; font-size: 3em; margin-bottom: 0; }
        h2 { margin-top: 0; }
        pre { background-color: #ccc; border-radius: 1em; padding: 1em; margin-left: -1em; margin-right: -1em; overflow: auto;} 
      </style>
    `
    this.app = polka({
      onError: (error, _request, response, _next) => {
        if (error.status === 404) {
          const errorPage = errorTemplate
          .replace('{CODE}', error.status)
          .replace('{ERROR}', 'Page not found.')
          .replace('{STACK}', 'Sorry, that page does not exist.')
          response.end(errorPage)
          return
        }

        // If we’re here, the error occured while page was initially loading
        // so display the basic error template.
        response.statusCode = error.code || error.status || 500

        const errorPage = errorTemplate
          .replace('{CODE}', response.statusCode)
          .replace('{ERROR}', error.toString())
          .replace('{STACK}', error.stack)
        response.end(errorPage)
      }
    })

    // Add the WebSocket server.
    this.app.use(tinyws())
  }

  async initialise () {
    this.routes = await (new Routes()).initialise()
    
    // Add dynamic routes to server.
    for (const [pattern, route] of Object.entries(this.routes)) {
      this.app[route.method](pattern, route.handler)
    }
    
    // Add static routes to server.
    const staticFolder = path.join(process.env.basePath, '#static')
    if (fs.existsSync(staticFolder)) {
      this.app.use('/', serveStaticMiddleware(staticFolder))
    }
    
    // Set up the global JavaScript Database (JSDB) instance.
    const databaseDirectory = path.join(configurationPath(), 'database')
    const db = JSDB.open(databaseDirectory)

    // The virtual machine context used to run NodeScript in.
    // TODO: Pull this out into its own singleton or utility function?
    globalThis.context = vm.createContext({
      // NodeKit globals.
      db,

      // The app itself for advanced uses.
      app: this.app,

      // Node.js globals.
      console, URLSearchParams, URL, process,

      // (Fetch is part of undici right now but slated to be part
      // of Node 16 under an experimental flag and Node 18 without.
      // Once that lands, we can replace this with the standard
      // implementation.)
      fetch
    })
    
    // Get the handler from the Polka instance and create a secure site using it.
    // (Certificates are automatically managed by @small-tech/https).
    const { handler } = this.app

    this.server = https.createServer(this.options, handler)
    this.server.listen(443, () => {
      console.info(`⬢ NodeKit\n\n  💾 ${process.env.basePath}\n  🌍 https://${this.hostname}\n`)
    })
  }
}

