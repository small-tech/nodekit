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

import { routePatternFromFilePath, HTTP_METHODS } from '../Utils'

import HttpRoute from './HttpRoute'
import PageRoute from './PageRoute'
import SocketRoute from './WebSocketRoute'
import LazilyLoadedRoute from './LazyLoadedRoute'

export default class Routes extends EventTarget {
  initialised = false
  routes
  dependencyMap
  broadcastChannel

  constructor () {
    super()

    this.routes = {}

    // We use a regular broadcast channel to communicate with the ESM Loader,
    // which is really just another worker process.
    this.broadcastChannel = new LoaderAndMainProcessBroadcastChannel()
    this.broadcastChannel.onmessage = event => {
      this.routes[event.data.route].contents = event.data.contents
    }
  }

  async initialise () {
    this.files = new Files()
    // Start listening for file events after initialisation for
    // performance reasons (since we ignore events prior to initialisation anyway).
    this.filesByExtensionCategoryType = await this.files.initialise()
    this.files.addEventListener('file', this.handleFileChange)

    await this.createRoutes()

    this.initialised = true
    
    return this.routes
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
    const pattern = routePatternFromFilePath(filePath)
    const extension = path.extname(filePath).replace('.', '')
    const method = HTTP_METHODS.includes(extension) ? extension : 'get'

    const extensionsToRouteTypes = new Proxy({
      'page': PageRoute,
      'socket': SocketRoute
    }, {
      get: () => {
        // The default type if not page or socket.
        return HttpRoute
      }
    })

    console.verbose('[FILES] Creating route', pattern, extension)

    // Get a bound refernece to the lazily loaded route’s handler.
    const handler = (new LazilyLoadedRoute(extensionsToRouteTypes[extension], filePath)).handler

    console.verbose('[FILES] Adding route', method, pattern, filePath, handler)

    this.routes[pattern] = {
      method,
      handler
    }

    // Debug: show state of handlers.
    console.log('Latest state of routes:')
    console.log(this.routes)
    for (const [pattern, route] of Object.entries(this.routes)) {
      console.log(pattern, ':', route)
    }
  }

  // Create the routes and add them to the server.
  // The ESM Loaders will automatically handle any processing that needs to
  // happen during the import process.
  async createRoutes () {
    const extensions = Object.keys(this.filesByExtensionCategoryType.allRoutes)

    for (const extension of extensions) {
      const filePaths = this.filesByExtensionCategoryType.allRoutes[extension]
      for (const filePath of filePaths) {
        await this.createRoute(filePath)
      }
    }
  }
}

