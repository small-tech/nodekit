import path from 'path'
import { routePatternFromFilePath, HTTP_METHODS } from '../Utils'

export default class LazilyLoadedRoute {
  /**
   * Abstract base class for lazily-loaded routes.
   * 
   * @param {function|string} filePath 
   */
  constructor (filePath) {
    this.filePath = filePath
    this.extension = path.extname(this.filePath).replace('.', '')
    this.pattern = routePatternFromFilePath(this.filePath)
    this.method = HTTP_METHODS.includes(this.extension) ? this.extension : 'get' 
  }

  // Get a bound reference to the handler.
  get handler () {
    return this.lazilyLoadedHandler.bind(this)
  }
  
  // Override this method in subclasses to customise lazy loading and rendering logic.
  async lazilyLoadedHandler (request, response, next) {
    throw new Error(`LazilyLoadedRoute abstract base class handler called. You must override the lazilyLoadedHandler() method in your concrete subclass.`, request, response, next)
  }
}

