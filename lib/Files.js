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

export default class Files {
  basePath
  watcher
  filesByExtension

  static HTTP_METHODS = ['.get', '.head', '.patch', '.options', '.connect', '.delete', '.trace', '.post', '.put']
  static timeCounter = 0

  constructor (basePath = process.cwd()) {
    this.filesByExtension = {}

    // You can place your source files either in the project
    // folder directly or in a subfolder called src.
    const srcFolder = path.join(basePath, 'src')
    this.basePath = fs.existsSync(srcFolder) ? srcFolder : basePath
  }

  async initialise () {
    return new Promise((resolve, reject) => {
      // console.time(`Files ${++Files.timeCounter}`)

      const watcherGlob = `${this.basePath}/**`
      const watcherOptions = {
        // Emit events when initially discovering files.
        ignoreInitial: false
      }

      this.watcher =
      chokidar
        .watch(watcherGlob, watcherOptions)
        .on('ready', () => {
          // console.timeEnd(`Files ${Files.timeCounter}`)
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



  // createRoutes () {
  //   Object.keys(this.filesByExtension).forEach(extension => {
  //     // HTTP methods
  //     if Files.HTTP_METHODS.includes(extension) {
  //       polka
  //     }
  //   })
  // }
}
