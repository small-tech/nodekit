////////////////////////////////////////////////////////////
//
// Routes (production server)
//
// (Work-in-progress: currently hardcoded to production.)
//
// Copyright ⓒ 2021-present, Aral Balkan
// Small Technology Foundation
//
// License: AGPL version 3.0.
//
////////////////////////////////////////////////////////////

// Conditional logging.
console.verbose = process.env.VERBOSE ? function () { console.log(...arguments) } : () => {}

import { _findPath } from 'module'
import fs from 'fs'
import path from 'path'
import Files from '../Files.js'
import LoaderAndMainProcessBroadcastChannel from '../LoaderAndMainProcessBroadcastChannel.js'

import { routeFromFilePath, HTTP_METHODS } from '../Utils'

import HttpRoute from './HttpRoute'
import PageRoute from './PageRoute'
import SocketRoute from './WebSocketRoute'
import LazyLoadedRoute from './LazyLoadedRoute'

class CustomEvent extends Event {
  detail

  constructor (type, eventInitDict) {
    super (type, eventInitDict)
    this.detail = eventInitDict.detail
  }
}

export default class Routes extends EventTarget {
  initialised = false
  routes
  dependencyMap
  broadcastChannel

  constructor (basePath) {
    super()

    this.basePath = basePath

    this.routes = {}
    this.previousVersionsOfRoutes = {}

    // We use a regular broadcast channel to communicate with the ESM Loader,
    // which is really just another worker process.
    this.broadcastChannel = new LoaderAndMainProcessBroadcastChannel()
    this.broadcastChannel.onmessage = event => {
      this.routes[event.data.route] = event.data.contents
    }
  }

  async initialise () {
    this.files = new Files(this.basePath)
    // Start listening for file events after initialisation for
    // performance reasons (since we ignore events prior to initialisation anyway).
    this.filesByExtensionCategoryType = await this.files.initialise()
    this.files.addEventListener('file', this.handleFileChange)

    this.createRoutes()

    this.initialised = true
  }

  async handleFileChange(itemType, eventType, itemPath) {
    if (this.initialised) {
      // In production, simply exit (systemd will handle the restart).
      console.log(`${itemType.charAt(0).toUpperCase()+itemType.slice(1)} ${eventType} (${itemPath}), exiting to trigger auto-restart in production.`)
      process.exit(1)
    } else {
      // Note: this should never be reached. Remove?
      console.verbose('[handleFileChange]', itemPath, 'ignoring', 'not initialised')
    }
  }

  async createRoute (filePath) {
    const self = this
    const routes = this.routes
    const basePath = this.basePath
    const context = this.context

    const route = routeFromFilePath(filePath)
    const extension = path.extname(filePath).replace('.', '')
    const httpMethod = HTTP_METHODS.includes(extension) ? extension : 'get'

    const extensionsToRouteTypes = new Proxy({
      'page': PageRoute,
      'socket': SocketRoute
    }, {
      get: () => {
        // The default type if not page or socket.
        return HttpRoute
      }
    })

    console.verbose('[FILES] Creating route', route, extension)

    const _route = new LazyLoadedRoute(extensionsToRouteTypes[extension], filePath)

    console.verbose('[FILES] Adding route', httpMethod, route, filePath, _route)

    // Add handler to server.
    // TODO: (major-refactor) What’s this.app supposed to be? Is this the best place for it?
    this.app[httpMethod](route, _route.handler.bind(_route))

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
