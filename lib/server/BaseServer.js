////////////////////////////////////////////////////////////
//
// BaseServer
//
// Copyright ⓒ 2021-present, Aral Balkan
// Small Technology Foundation
//
// License: AGPL version 3.0.
//
////////////////////////////////////////////////////////////

// Conditional logging.
console.verbose = process.env.VERBOSE ? function () { console.log(...arguments) } : () => {}

import os from 'os'
import { _findPath } from 'module'
import polka from 'polka'

// Temporarily using my own fork where sirv only responds to GET requests that
// are not WebSocket requests (so as not to mask POST, WebSocket, etc., requests
// that may be on the same path).
import { tinyws } from 'tinyws'

class CustomEvent extends Event {
  detail

  constructor (type, eventInitDict) {
    super (type, eventInitDict)
    this.detail = eventInitDict.detail
  }
}

export default class Server extends EventTarget {
  constructor () {
    super()

    this.hostname = os.hostname()

    // TODO: Remove + implement proper logic to decide localhost vs hostname usage.
    // DEBUG: hardcode to localhost for now.
    this.hostname = 'localhost'

    this.options = { domains: [this.hostname] }

    // Create the app.
    const errorTemplate = `
      <h1>{CODE}</h1>
      <h2>{ERROR}</h2>
      <pre><code>{STACK}</code></pre>
      <style>
        body { font-family: sans-serif; font-size: 1.5em; padding: 1em 2em; }
        h1 { color: red; font-size: 3em; margin-bottom: 0; }
        h2 { margin-top: 0; }
        pre { background-color: #ccc; border-radius: 1em; padding: 1em; margin-left: -1em; margin-right: -1em; overflow: auto;} 
      </style>
    `
    this.app = polka({
      onError: (error, request, response, next) => {

        // console.log('Polka onError', error)

        if (this.socket) {
          // A development socket exists so the client should be able to handle
          // a json response and display it in an error modal.
          response.statusCode = error.code || error.status || 500
          response.setHeader('content-type', 'application/json')
          response.end(JSON.stringify({
            status: response.statusCode,
            message: error.toString(),
            stack: error.stack
          }))
          return
        }

        if (error.status === 404) {
          const errorPage = errorTemplate
          .replace('{CODE}', error.status)
          .replace('{ERROR}', 'Page not found.')
          .replace('{STACK}', 'Sorry, that page does not exist.')
          response.end(errorPage)
          return
        }

        // If we’re here, the error occured while page was initially loading
        // so display the basic error template.
        response.statusCode = error.code || error.status || 500

        const errorPage = errorTemplate
          .replace('{CODE}', response.statusCode)
          .replace('{ERROR}', error.toString())
          .replace('{STACK}', error.stack)
        response.end(errorPage)
      }
    })

    // Add the WebSocket server.
    this.app.use(tinyws())
  }

}
