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

import { extensionCategories, extensionOfFilePath } from './Utils'
const extensionCategoryTypes = Object.keys(extensionCategories)

class CustomEvent extends Event {
  detail

  constructor (type, eventInitDict) {
    super (type, eventInitDict)
    this.detail = eventInitDict.detail
  }
}

export default class Files extends EventTarget {
  watcher
  filesByExtensionCategoryType  
  initialised = false

  constructor (pathToWatch) {
    super()
    this.pathToWatch = pathToWatch
    
    this.filesByExtensionCategoryType = {
      backend: {},
      frontend: {},
      dependency: {},
      all: {}
    }
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
          resolve(this.filesByExtensionCategoryType)
        })
        .on('add', (filePath, stats) => {
          console.verbose('Chokidar add:', filePath)

          // A file added event fires regardles of whether this file is a
          // supported route extension (or even a dependency) – for example,
          // it could just be a static file. This is so that, in production mode,
          // the server can restart conservatively whenever _any_ file changes so
          // we know that we are always running the latest deployed version of a site/app.
          // TODO: if “change” is the level of granularity we end of up needing for this
          // functionality, it might make sense to only have a single “change” event for all
          // changes fire. No need to make a decision on this now; let’s evaluate through
          // usage as Nodekit matures.
          this.notifyListeners('file', 'added', filePath)

          // Filter out directories and static files.
          if (extensionOfFilePath(filePath) != '' && !filePath.includes('#static')) {
            this.addFile(filePath)
          } 
        })
        .on('change', filePath => { this.notifyListeners('file', 'changed', filePath) })
        .on('unlink', filePath => { 
          console.verbose('Chokidar unlink:', filePath)
          this.notifyListeners('file', 'unlinked', filePath)
          // TODO
          // this.removeFile(filePath)        
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

  addFile(filePath) {
    const extension = extensionOfFilePath(filePath)

    for (const extensionCategoryType of extensionCategoryTypes) {
      if (extensionCategories[extensionCategoryType].includes(extension)) {
        // This might be the first time a file of this extension is encountered.
        // If so, create the category before attempting to add to it.
        if (!this.filesByExtensionCategoryType[extensionCategoryType]) {
          this.filesByExtensionCategoryType[extensionCategoryType] = []
        }

        this.filesByExtensionCategoryType[extensionCategoryType].push(filePath)

        this.notifyListeners('route', 'added', extension, filePath)
      }  
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
