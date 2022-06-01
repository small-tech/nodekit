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

import path from 'path'
import { _findPath } from 'module'
import Files from '../Files.js'
import LoaderAndMainProcessBroadcastChannel from '../LoaderAndMainProcessBroadcastChannel.js'
import { routePatternFromFilePath} from '../Utils'

import HttpRoute from './HttpRoute'
import PageRoute from './PageRoute'
import SocketRoute from './WebSocketRoute'

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
      console.verbose('About to update contents of route', event.data.pattern, event.data.contents)
      Object.assign(this.routes[event.data.pattern], event.data.contents)
    }
  }

  async initialise () {
    // Get the files in the site being served.
    this.files = new Files()
    this.filesByExtensionCategoryType = await this.files.initialise()

    // Start listening for file events after initialisation for
    // performance reasons (since we ignore events prior to initialisation anyway).
    this.files.addEventListener('file', this.handleFileChange)

    // Create the routes from the files structure.
    this.createRoutes()

    // Flag that we’re initialised (this affects event broadcasts).
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

    // Create the routes and add them to the server.
  // The ESM Loaders will automatically handle any processing that needs to
  // happen during the import process.
  createRoutes () {
    const extensions = Object.keys(this.filesByExtensionCategoryType.allRoutes)

    for (const extension of extensions) {
      const filePaths = this.filesByExtensionCategoryType.allRoutes[extension]
      for (const filePath of filePaths) {
        const extension = path.extname(filePath).replace('.', '')

        // If a specialised route type doesn’t exist for the given extension,
        // default to the base HttpRoute type.
        const RouteType = {
          'page': PageRoute,
          'socket': SocketRoute
        }[extension] || HttpRoute

        const pattern = routePatternFromFilePath(filePath)
        this.routes[pattern] = new RouteType(filePath)
      }
    }
  }
}

