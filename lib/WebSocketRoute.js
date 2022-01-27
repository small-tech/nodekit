// Represents one WebSocket route.
// The handler wraps the actual handler to decorate it with a
// broadcast method.
export default class WebSocketRoute {
  _handler
  connections

  constructor (handler) {
    this._handler = handler
    this.connections = []
  }

  async handler (request, response, next) {
    if (request.method === 'GET' && request.ws) {
      console.log('[WebSocketRoute Handler]', request.method, request.originalUrl)
      const ws = await request.ws()

      this.connections.push(ws)

      const _connections = this.connections

      const socket = new Proxy({}, {
        get: function (obj, prop) {
          // Add helper methods to ws.
          switch (prop) {
            case 'broadcast':
              // Send to everyone but the socket that is broadcasting.
              return (message => {
                _connections.forEach(socket => {
                  if (socket !== ws) {
                    socket.send(message)
                  }
                })
                // Return the number of connections sent to.
                return _connections.length - 1
              })
            break

            case 'all':
              // Send to everyone (including the current client)
              return (message => {
                _connections.forEach(socket => {
                  socket.send(message)
                })
                // Return the number of connections sent to.
                return _connections.length
              })
            break

            default:
              // For everything else, proxy to the WebSocket object.
              return ws[prop]
          }
        }
      })

      // Call the actual handler.
      this._handler(socket, request, response)
    } else {
      // This is not a socket route, call next in case there is an HTTP route
      // at the same path that wants to handle the request.
      next()
    }
  }
}
