import path from 'path'

import LazilyLoadedRoute from './LazilyLoadedRoute'

import { renderPage } from '../../page-template'
import nodeScriptBundler from '../esbuild/NodeScriptBundler'
import { classNameFromFilePath } from '../Utils'

export default class PageRoute extends LazilyLoadedRoute {
  loaded = false
  page = null
  nodeScript = null
  nodeScriptHandler = null
  nodeScriptSource = null
  
  constructor (filePath) {
    super(filePath)
    this.className = classNameFromFilePath(this.pattern) 
  }

  // A page is rendered in real time, possibly with server-side data.
  async lazilyLoadedHandler (request, response) {
    if (!this.loaded) {
      this.page = (await import(this.filePath)).default

      if (this.nodeScript && !this.nodeScriptHandler) {
        const _ = await nodeScriptBundler(this.nodeScript, process.env.basePath, this.filePath)
        this.nodeScriptHandler = _.module
        this.nodeScriptSource = _.source
      }
    
      this.loaded = true
    }
    
    // Run NodeScript module (if any) in its own V8 Virtual Machine context.
    let data = undefined
    if (this.nodeScript) {
      // Run the nodeScript.
      try {
        data = await this.nodeScriptHandler(request, response)
      } catch (error) {
        console.error(`[NodeScript error]`)
        const errorStack = error.stack.toString()
        const errorLocation = /page:(\d*?):(\d*?)\)/.exec(errorStack)
        const errorLineOffset = parseInt(errorLocation[1])
        const errorColumnOffset = parseInt(errorLocation[2])

        // Translate the location values to 0-based array indeces.
        const errorLineIndex = errorLineOffset - 1
        const errorColumnIndex = errorColumnOffset - 1
        
        const errorSourceLines = this.nodeScriptSource.split('\n')
        console.log(errorSourceLines)
        const errorSourceLookAround = 3 // lines
        const errorLineStartIndex = Math.max(errorLineIndex-errorSourceLookAround, 0)
        const errorLineEndIndex = Math.min(errorLineIndex+errorSourceLookAround, errorSourceLines.length)
        
        console.log('line, start, end', errorLineIndex, errorLineStartIndex, errorLineEndIndex)

        let detailedErrorLocation = ''
        for (let i = errorLineStartIndex; i < errorLineEndIndex; i++) {
          if (i === errorLineIndex) {
            detailedErrorLocation += '<span style="color: black;">' + errorSourceLines[i] + '</span>\n'
            detailedErrorLocation += `${'-'.repeat(errorColumnIndex)}^\n`
          } else {
            detailedErrorLocation += '<span style="color: grey;">' + errorSourceLines[i] + '</span>\n'
          }
        }
        
        // console.error(this.nodeScriptSource)
        // console.error(error)

        const nodeScriptError = new Error('NodeScript execution failure')
        nodeScriptError.stack = '// <strong>' + this.filePath.replace(process.env.basePath + path.sep, '') + '</strong> (linked NodeScript bundle)\n\n'
          + detailedErrorLocation + '\n' 
          + error.stack
        
        throw nodeScriptError
      }
    }
    
    // Render the page, passing the server-side data as a property.
    const { html, css } = this.page.render({ data })
    const renderedHtml = renderPage(this.pattern, this.className, html, css.code, this.hydrationScript, data)
    response.end(renderedHtml)
  }
}

