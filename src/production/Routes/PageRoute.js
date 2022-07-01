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
        // Display helpful error messages on runtime NodeScript errors.
        const errorStack = error.stack.toString()
        const errorLocation = /page:(\d*?):(\d*?)\)/.exec(errorStack)
        const errorLineOffset = parseInt(errorLocation[1])
        const errorColumnOffset = parseInt(errorLocation[2])

        // Translate the location values to 0-based array indeces.
        const errorLineIndex = errorLineOffset - 1
        const errorColumnIndex = errorColumnOffset - 1
        
        const errorSourceLines = this.nodeScriptSource.split('\n')
        const errorSourceLookAround = 3 // lines
        const errorLineStartIndex = Math.max(errorLineIndex-errorSourceLookAround, 0)
        const errorLineEndIndex = Math.min(errorLineIndex+errorSourceLookAround, errorSourceLines.length - 1)
        
        const red = '<span style="color: red; font-weight: 800;">'
        const endRed = '</span>'
        const black = '<span style="color: black; font-weight: 800;">'
        const endBlack = '</span>'
        const endGrey = endRed
        const grey = '<span style="color: grey;">'
        const strong = '<strong>'
        const endStrong = '</strong>'

        let detailedErrorLocation = ''
        for (let i = errorLineStartIndex; i <= errorLineEndIndex; i++) {
          const lineNumber = `${i+1}: `
          if (i === errorLineIndex) {
            detailedErrorLocation +=  red + lineNumber + errorSourceLines[i] + endRed + '\n'
            const spaceTakenByLineNumber = lineNumber.length
            detailedErrorLocation += red + `${' '.repeat(spaceTakenByLineNumber + errorColumnIndex)}🢁` + endRed + '\n'
          } else {
            detailedErrorLocation += grey + lineNumber + errorSourceLines[i] + endGrey + '\n'
          }
        }
        
        const originalErrorStack = error.stack
        const originalErrorStackLines = originalErrorStack.split('\n')
        originalErrorStackLines[0] = `${black}${originalErrorStackLines[0]}${endBlack}`
        const formattedOriginalErrorStack = originalErrorStackLines.join('\n')
        
        const nodeScriptError = new Error('NodeScript runtime error')
        const errorFileName = this.filePath.replace(process.env.basePath + path.sep, '')
        nodeScriptError.stack = '// ' + strong + errorFileName + endStrong + ' (linked NodeScript bundle)\n\n'
          + detailedErrorLocation + '\n' 
          + formattedOriginalErrorStack
        
        // Also display the error in the console (but without the HTML formatting).
        console.error('Error: NodeScript runtime error\n')
        console.error(`// ${errorFileName} (linked NodeScript bundle)\n`)
        console.error(detailedErrorLocation.replace(/<span.*?>/g, '').replace(/<\/span>/g, '').replace(/<strong>/g, '').replace(/<\/strong>/g, ''))
        console.error(error)

        throw nodeScriptError
      }
    }
    
    // Render the page, passing the server-side data as a property.
    const { html, css } = this.page.render({ data })
    const renderedHtml = renderPage(this.pattern, this.className, html, css.code, this.hydrationScript, data)
    response.end(renderedHtml)
  }
}

