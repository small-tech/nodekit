import path from 'path'
import { routePatternFromFilePath, HTTP_METHODS } from '../Utils'

import LazilyLoadedRoute from './LazilyLoadedRoute.js'

export default class HttpRoute extends LazilyLoadedRoute {
  async lazilyLoadedHandler (request, response) {
    this._handler = this._handler || (await import(this.filePath)).default
    await this._handler(request, response)
  }
}

