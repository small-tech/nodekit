// TODO: We need a call from the client to let us know when a site has responded so we can set the domain status to active.

const path = require('path')
const getRoutes = require ('@small-tech/web-routes-from-files')
const Remote = require('@small-tech/remote')

const fs = require('fs')

console.log(__dirname)
const handlersDirectory = path.join(__dirname, '.lib', 'requestHandlers')
const routes = getRoutes(handlersDirectory, handlersDirectory)

const regExp = new RegExp(path.sep, 'g')
const requestHandlers = {}
routes.forEach(route => {
  // Transform the URL fragments returned into message names
  // (e.g., /psl/validate becomes psl.validate.request) and
  // map them to their respective request handlers.
  const messageType = `${route.path.slice(1).replace(regExp, '.')}.request`
  requestHandlers[messageType] = require(route.callback)
})

console.log('requestHandlers', requestHandlers)

module.exports = function (client, request) {
  const password = request.params.password

  console.log(`   🔐️    ❨Domain❩ Socket connection request.`)

  // Set the client’s room to limit private broadcasts to people who are authenticated.
  client.room = this.setRoom({url: '/admin'})

  const remote = new Remote(client)

  // Not using Remote here as we have unique routing requirements for requests.
  client.on('message', async data => {
    const message = JSON.parse(data)

    const messageHandler = requestHandlers[message.type]
    if (messageHandler === undefined) {
      console.log(`Warning: received unexpected message type: ${message.type}`)
    } else {
      messageHandler(remote, message)
    }
  })

  if (password !== db.admin.password) {
    console.log(`   ⛔️    ❨Domain❩ Unauthorised password: ${password}`)
    remote.signIn.error.send({
      error: 'Error: unauthorised.'
    })
    client.close()
  } else {
    console.log(`   🔓️    ❨Domain❩ Authorised password: ${password}`)
    // Send a signal that sign in has succeeded.
    remote.signIn.response.send()

    // Next, send the settings.
    remote.settings.send({
      body: db.settings
    })
    // this.broadcast(client, `There’s been a new login from ${request._remoteAddress}`)
  }
}

if (db.settings === undefined) {
  // Initialise the settings object.
  db.settings = require(path.join(__dirname, '.lib/initial-settings.cjs'))
}
