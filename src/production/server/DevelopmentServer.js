// Creates a WebSocket at /.well-known/dev used for hot module reloading, etc., during
// development time.

import BaseServer from './BaseServer'
import Routes from '../Routes'

export default class DevelopmentServer extends BaseServer {
  async initialise () {
    this.routes = new Routes(this.basePath)
    await this.routes.initialise()
  }
}

// createDevelopmentSocket () {
//   const self = this
//   const devSocket = new WebSocketRoute((socket, request, response) => {
//     console.verbose('[DEV SOCKET] New connection')
//     self.socket = socket
//   })

//   this.app.get('/.well-known/dev', devSocket.handler.bind(devSocket))

//   // Because of Firefox’s ridiculous automatic fallback/retry on WebSocket 
//   // connection failures, we can’t simply manually retry failed connections.
//   // Instead, implement an HTTP ping route that we can fall separately to
//   // test if the server is up and use that.
//   this.app.get('/.well-known/ping', (request, response) => {
//     response.end()
//   })
// }