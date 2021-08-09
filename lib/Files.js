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

export default class Files {
  basePath
  watcher
  filesByExtension

  static timeCounter = 0

  constructor (basePath) {
    console.time(`Files ${Files.timeCounter++}`)

    // You can place your source files either in the project
    // folder directly or in a subfolder called src.
    const srcFolder = path.join(basePath, 'src')
    this.basePath = fs.existsSync(srcFolder) ? srcFolder : basePath

    const watcherGlob = `${this.source}/**`
    const watcherOptions = {
      // Emit events when initially discovering files.
      ignoreInitial: false
    }
  }

  async initialise () {
    return new Promise((resolve, reject) => {
      this.watcher =
      chokidar
        .watch(watcherGlob, watcherOptions)
        .on('ready', () => {
          console.timeEnd(`Files ${Files.timeCounter}`)
          resolve(this.filesByExtension)
        })
        .on('add', (filePath, stats) => {
          const extension = path.extname(filePath)
          if (!this.filesByExtension[extension]) {
            this.filesByExtension[extension] = []
          }
          filesByExtension[extension].push(filePath)
        })
        .on('error', error => {
          console.error('Files error', error)
          reject(error)
        })
    })
  }
}
