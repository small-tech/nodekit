// Development socket connection.

const errorOverlay = document.getElementById('overlay')
const errorTitle = document.getElementById('errorTitle')
const errorMessage = document.getElementById('errorMessage')
const errorDetails = document.getElementById('errorDetails')

let pingServerIntervalId = null
let carryingOutLiveReload = false
let socket 

const messageHandler = async event => {
  const message = JSON.parse(event.data)
  if (message.type === 'reload') {
    // Live reload.
    carryingOutLiveReload = true

    // Initially try and get the page via XHR so we can catch and display any errors.
    const response = await fetch(window.location.href+ '?' + Math.random())

    if (response.status !== 200) {

      // We should have received a JSON response with the error information;
      // display it in the error modal.

      const error = await response.json()

      carryingOutLiveReload = false
      errorTitle.innerText = error.status
      errorMessage.innerText = error.message

      // TODO: Remove this logic to server-side and do proper line-number massaging
      // based on the sourcemap.
      errorDetails.innerText = error.stack.replace(error.message + '\n', '').replace(/    /g, '').replace(/\?.*?:/g, ':') // last one replaces the cache-buster query strings
      errorOverlay.classList.add('showOverlay')  
      return
    }
    errorOverlay.classList.remove('showOverlay')
    window.location.reload()
  } else if (message.type === 'css') {
    // Inject CSS.
    document.getElementById('__style__').innerHTML = message.code
  }
}

const openHandler = event => {
  console.log('[Nodekit] Development web socket is open.', event)
}

const closeHandler = event => {
  console.log('[Nodekit] Development server has gone away. Will watch for it come back…', event)

  socket.removeEventListener('message', messageHandler)
  socket.removeEventListener('open', openHandler)
  socket.removeEventListener('close', closeHandler)
  socket.removeEventListener('error', errorHandler)
  socket = null

  if (!carryingOutLiveReload) {
    carryingOutLiveReload = false
    errorTitle.innerText = 'Disconnected'
    errorMessage.innerText = 'The connection with the NodeKit development server has been lost.'
    errorDetails.innerText = 'Please restart the server or reconnect to continue.'
    errorOverlay.classList.add('showOverlay')
  
    // The server has gone away so we’re going to hit our well-known ping route
    // until we get a response before trying the WebSocket connection.
    // (We can’t just retry the WebSocket connection for two reasons: 1. Firefox
    // has a ridiculous exponential falloff implemented that you cannot override
    // and 2. You can’t catch errors on WebSocket connection failures so your
    // developer console will fill up with them.)
    pingServerIntervalId = setInterval(async () => {
      try {
        await fetch('/.well-known/ping')
      } catch (error) {
        return
      }

      console.log('[Nodekit] Development server is available again. Reconnecting WebSocket…')

      clearInterval(pingServerIntervalId)

      // Ask for a reload as we will need one anyway. That will re-render this
      // page on the server and initialise it, including setting up a new
      // development WebSocket connection. 
      window.location.reload()
    }, 1000)
  }
}

const errorHandler = event => {
  console.log('[Nodekit] Development server error.', event)
}

const connect = () => {
  socket = new WebSocket('wss://localhost/.well-known/dev')
  socket.addEventListener('message', messageHandler)
  socket.addEventListener('open', openHandler)
  socket.addEventListener('close', closeHandler)
  socket.addEventListener('error', errorHandler)
}

connect()
