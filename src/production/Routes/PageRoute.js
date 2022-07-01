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
        console.error(this.nodeScriptSource)
        console.error(error.stack)
        throw error
      }
    }
    
    // Render the page, passing the server-side data as a property.
    const { html, css } = this.page.render({ data })
    const renderedHtml = renderPage(this.pattern, this.className, html, css.code, this.hydrationScript, data)
    response.end(renderedHtml)
  }
}

