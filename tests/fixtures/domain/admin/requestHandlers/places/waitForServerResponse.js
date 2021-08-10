const fetch = require('node-fetch')

const duration = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

module.exports = async (remote, message) => {
  // Validate request.
  if (db.domains[message.domain] === undefined) {
    return remote.places.waitForServerResponse.error.send({ error: 'Domain not found.' })
  }

  if (db.domains[message.domain].status !== 'setup-vps-created') {
    return remote.places.waitForServerResponse.error.send({
      error: `Incorrect domain status (${db.domains[message.domain].status}). Should be 'setup-vps-created'.`
    })
  }

  // Request is valid.

  console.log('Waiting for server response for', message.url)
  let serverResponseReceived = false

  const newSiteUrl = `https://${message.domain}.${db.settings.dns.domain}`

  // TODO: Implement timeout.

  while (!serverResponseReceived) {
    console.log(`Trying to see if ${newSiteUrl} is ready.`)
    let response
    try {
      response = await fetch(newSiteUrl)
      serverResponseReceived = response.ok
    } catch (error) {
      console.log(`${newSiteUrl} is not yet ready, got an error.`)
    }
    if (!serverResponseReceived) {
      console.log(`${newSiteUrl} not ready, waiting a bit before retrying…`)
      // Wait a second before trying again.
      await duration(1000)
    }
  }

  db.domains[message.domain].status = 'active'

  console.log(`🎉️ ${newSiteUrl} is ready!`)

  remote.places.waitForServerResponse.response.send()
}
