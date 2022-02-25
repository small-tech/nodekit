// Development socket connection.

const errorOverlay = document.getElementById('overlay')
const errorTitle = document.getElementById('errorTitle')
const errorMessage = document.getElementById('errorMessage')
const errorDetails = document.getElementById('errorDetails')

let retryConnectionIntervalId = null

let __devSocket 

const connect = () => {
  __devSocket = new WebSocket('wss://localhost/.well-known/dev')

  __devSocket.addEventListener('message', event => {
    const message = JSON.parse(event.data)
    if (message.type === 'reload') {
      // Live reload.
      window.location.reload(true)
    } else if (message.type === 'css') {
      // Inject CSS.
      document.getElementById('__style__').innerHTML = message.code
    }
  })
  
  __devSocket.addEventListener('open', event => {
    console.log('Development web socket is open.', event)

    if (retryConnectionIntervalId !== null) {
      console.log('((( RECONNECTED. ASKING FOR RELOAD. )))')
      // We were retrying after a lost connection.
      clearInterval(retryConnectionIntervalId)
      // Ensure we reload so that our route is lazily created again on the server.
      window.location.reload(true)
    }
  })
  
  __devSocket.addEventListener('close', event => {
    console.log('Development server is closed.', event)
  
    errorTitle.innerText = 'Disconnected'
    errorMessage.innerText = 'The connection with the NodeKit development server has been lost.'
    errorDetails.innerText = 'Please restart the server or reconnect to continue.'
    errorOverlay.classList.add('showOverlay')
  
    retryConnectionIntervalId = setInterval(connect, 1000)
  })
  
  __devSocket.addEventListener('error', event => {
    console.log('Development server error.', event)
  })
}

connect()
