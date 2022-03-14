/**
 * Lazily loads handler for RouteType.
 */
export default class LazyLoadedRoute {
  /**
   * @param {class<HttpRoute>} RouteType 
   * @param {string} filePath 
   */
  constructor (RouteType, filePath) {
    this.route = new RouteType(filePath)
  }

  async handler (request, response) {
    try {
      if (this.route.handlerNotLoaded) {
        this.route.loadHandler()
      }
      this.route.handler(request, response)
    } catch (error) {
      console.error(error)
      response.statusCode = 500
      response.end(error.stack.toString())
    }
  }
}
