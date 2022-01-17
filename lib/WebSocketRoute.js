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
    console.log('[WebSocketRoute] Handler called', request.method, request.originalUrl)
    if (request.method === 'GET' && request.ws) {
      const ws = await request.ws()

      this.connections.push(ws)

      const _connections = this.connections

      const socket = new Proxy({}, {
        get: function (obj, prop) {
          // Add broadcast method to ws.
          if (prop === 'broadcast') {
            return (message => {
              _connections.forEach(socket => {
                // Send to everyone but the socket that is broadcasting.
                if (socket !== ws) {
                  socket.send(message)
                }
              })
              // Return the number of connections sent to.
              return _connections.length - 1
            })
          } else {
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
