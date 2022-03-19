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

import { HTTP_METHODS } from './Utils'

class CustomEvent extends Event {
  detail

  constructor (type, eventInitDict) {
    super (type, eventInitDict)
    this.detail = eventInitDict.detail
  }
}

export default class Files extends EventTarget {
  watcher
  filesByExtension
  initialised = false

  constructor (pathToWatch) {
    super()
    this.pathToWatch = pathToWatch
    this.filesByExtension = {}
  }

  async initialise () {
    // Sanity check: ensure the path to watch exists.
    if (!fs.existsSync(this.pathToWatch)) {
      throw new Error(`File watcher: ${this.pathToWatch} does not exist. Panic!`)
    }

    return new Promise((resolve, reject) => {
      const watcherGlob = `${this.pathToWatch}/**/*.@(page|component|socket|${HTTP_METHODS.join('|')})`
      const watcherOptions = {
        // Emit events when initially discovering files.
        ignoreInitial: false,
        ignored: /(^|[\/\\])\..|node_modules|#static/ // ignore dotfiles/dotfolders as well as the node_modules and #static folders
      }

      this.watcher =
      chokidar
        .watch(watcherGlob, watcherOptions)
        .on('ready', async () => {
          this.initialised = true
          resolve(this.filesByExtension)
        })
        .on('add', (filePath, stats) => {
          console.verbose('Chokidar add:', filePath)

          this.notifyListeners('file', 'added', filePath)

          const extension = path.extname(filePath).replace('.', '')
          if (!this.filesByExtension[extension]) {
            this.filesByExtension[extension] = []
          }
          this.filesByExtension[extension].push(filePath)
        })
        .on('change', filePath => { this.notifyListeners('file', 'changed', filePath) })
        .on('unlink', filePath => { this.notifyListeners('file', 'unlinked', filePath) })
        .on('addDir', filePath => { this.notifyListeners('directory', 'added', filePath)})
        .on('unlinkDir', filePath => { this.notifyListeners('directory', 'unlinked', filePath) })
        .on('error', async error => {
          await this.watcher.close()
          reject(error)
        })
    })
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
