import LazilyLoadedRoute from './LazilyLoadedRoute'

import { renderPage } from '../../page-template'
import nodeScriptBundler from '../esbuild/NodeScriptBundler'
import { classNameFromFilePath } from '../Utils'

export default class PageRoute extends LazilyLoadedRoute {
  loaded = false
  page = null
  nodeScript = null
  nodeScriptHandler = null
  
  constructor (filePath) {
    super(filePath)
    
    console.log('PageRoute constructor', filePath)
    this.className = classNameFromFilePath(this.pattern) 
  }

  // A page is rendered in real time, possibly with server-side data.
  async lazilyLoadedHandler (request, response) {
    if (!this.loaded) {
      this.page = (await import(this.filePath)).default

      if (this.nodeScript && !this.nodeScriptHandler) {
        this.nodeScriptHandler = await nodeScriptBundler(this.nodeScript, process.env.basePath)
      }
    
      this.loaded = true
    }
    
    // Run NodeScript module (if any) in its own V8 Virtual Machine context.
    let data = undefined
    if (this.nodeScript) {
      // Run the nodeScript.
      data = await this.nodeScriptHandler(request, response)
    }

    // Render the page, passing the server-side data as a property.
    const { html, css } = this.page.render({ data })
    const renderedHtml = renderPage(this.pattern, this.className, html, css.code, this.hydrationScript, data)
    response.end(renderedHtml)
  }
}

