////////////////////////////////////////////////////////////
//
// Files: handles the files in the project.
//
// Copyright ⓒ 2021-present, Aral Balkan
// Small Technology Foundation
//
// License: AGPL version 3.0.
//
////////////////////////////////////////////////////////////

import fs from 'fs'

// Conditional logging.
console.verbose = process.env.VERBOSE ? function () { console.log(...arguments) } : () => {}

import { _findPath } from 'module'
import path from 'path'
import chokidar from 'chokidar'

import { ALL_ROUTE_EXTENSIONS, BACKEND_EXTENSIONS, FRONTEND_EXTENSIONS, DEPENDENCY_EXTENSIONS} from './Utils'

class CustomEvent extends Event {
  detail

  constructor (type, eventInitDict) {
    super (type, eventInitDict)
    this.detail = eventInitDict.detail
  }
}

export default class Files extends EventTarget {
  watcher
  allRoutes
  frontendRoutes
  backendRoutes
  dependencies
  
  initialised = false

  constructor (pathToWatch) {
    super()
    this.pathToWatch = pathToWatch
    this.allRoutes = {}
    this.frontendRoutes = {}
    this.backendRoutes = {}
    this.dependencies = {}
  }

  async initialise () {
    // Sanity check: ensure the path to watch exists.
    if (!fs.existsSync(this.pathToWatch)) {
      throw new Error(`File watcher: ${this.pathToWatch} does not exist. Panic!`)
    }

    return new Promise((resolve, reject) => {
      // Watch everything within the path to watch apart from the ignored
      // options specified below.
      const watcherGlob = `${this.pathToWatch}/**/*`

      const watcherOptions = {
        // Emit events when initially discovering files.
        ignoreInitial: false,
        // (We can ignore node_modules in both production and development as a
        // change there will be caught by a change in the package.json file.)
        ignored: /(^|[\/\\])\..|node_modules/ // ignore dotfiles/dotfolders as well as the node_modules and #static folders
      }

      this.watcher = chokidar
        .watch(watcherGlob, watcherOptions)
        .on('ready', async () => {
          this.initialised = true
          const result = {
            all: this.allRoutes,
            backend: this.backendRoutes,
            frontend: this.frontendRoutes,
            dependencies: this.dependencies
          }
          resolve(result)
        })
        .on('add', (filePath, stats) => {
          console.verbose('Chokidar add:', filePath)

          this.notifyListeners('file', 'added', filePath)

          const extension = path.extname(filePath).replace('.', '')
          // Filter out directories and static files.
          if (extension != '' && !filePath.includes('#static')) {
            this.handleExtension(ALL_ROUTE_EXTENSIONS, this.allRoutes, extension, filePath)
            this.handleExtension(BACKEND_EXTENSIONS, this.backendRoutes, extension, filePath)
            this.handleExtension(FRONTEND_EXTENSIONS, this.frontendRoutes, extension, filePath)
            this.handleExtension(DEPENDENCY_EXTENSIONS, this.dependencies, extension, filePath)
          } 
        })
        .on('change', filePath => { this.notifyListeners('file', 'changed', filePath) })
        .on('unlink', filePath => { 
          console.verbose('Chokidar unlink:', filePath)
          this.notifyListeners('file', 'unlinked', filePath)
        
          const extension = path.extname(filePath).replace('.', '')
          // TODO: Implement proper deletion that looks through all route collections.
          // delete this.filesByExtension[extension]          
        })
        // When a directory is unlinked, we should sync the state of the files in that directory.
        // (Does an unlink directory result in specific unlink events for all files in the directory?) TODO: Test.
        .on('addDir', filePath => { this.notifyListeners('directory', 'added', filePath)})
        .on('unlinkDir', filePath => { this.notifyListeners('directory', 'unlinked', filePath)})
        .on('error', async error => {
          await this.watcher.close()
          reject(error)
        })
    })
  }

  handleExtension(extensions, extensionCollection, extension, filePath) {
    if (extensions.includes(extension)) {
      if (!extensionCollection[extension]) {
        extensionCollection[extension] = []
      }
      extensionCollection[extension].push(filePath)
      this.notifyListeners('route', 'added', extension, filePath)
    }
  }

  async notifyListeners(itemType, eventType, itemPath) {
    if (this.initialised) {
      this.dispatchEvent(new CustomEvent('file', {
        detail: {
          eventType,
          itemType,
          itemPath  
        }
      }))
    } else {
      console.verbose('[notifyListeners]', itemPath, 'ignoring', 'not initialised')
    }
  }

  async close() {
    await this.watcher.close()
  }
}
