import HttpRoute from './HttpRoute'
import { renderPage } from '../../page-template'
import nodeScriptBundler from '../esbuild/NodeScriptBundler'
import { classNameFromRoute } from '../Utils'

export default class PageRoute extends HttpRoute {
  constructor (handlerOrFilePath) {
    super(handlerOrFilePath)
    
    console.log('PageRoute constructor', handlerOrFilePath)
    
    this.className = classNameFromRoute(handlerOrFilePath) 
  }

  async loadHandler () {
    this.page = (await import(this.filePath)).default

    const routeCache = routes[route] // TODO: Get this from global Routes

    if (routeCache.nodeScript && !routeCache.nodeScriptHandler) {
      routeCache.nodeScriptHandler = nodeScriptBundler(routeCache.nodeScript, basePath)
    }
  }

  async handler (request, response) {
    // Run NodeScript module (if any) in its own V8 Virtual Machine context.
    let data = undefined
    if (routeCache.nodeScript) {
      // Run the nodeScript.
      data = await routeCache.nodeScriptHandler(request, response)
    }

    // Render the page, passing the server-side data as a property.
    const { html, css } = this.page.render({data})
    const renderedHtml = renderPage(route, className, html, css.code, hydrationScript, data)
    response.end(renderedHtml)
  }
}
