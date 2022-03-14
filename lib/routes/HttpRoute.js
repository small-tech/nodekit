export default class HttpRoute {
  /**
   * Create a route instance with with the provided handler function directly
   * or lazily from the provided file path for the handler function when
   * when the loadHandler() method is called.
   * 
   * @param {function|string} handler 
   */
   constructor (handler) {
    // If the handler function is passed in directly, assign it immediately.
    // If not, we expect the file path to the source code that we will load
    // in lazily when the route is first hit.
    if (typeof handler === 'Function') {
      this._handler = handler
    } else {
      this.filePath = handler
    }
  }

  async loadHandler () {
    this._handler = this._handler || (await import(this.filePath)).default
  }

  async handler (request, response) {
    await this._handler(request, response)
  }
}
