const HetznerCloud = require('hcloud-js')
const dnsimple = require('dnsimple')

module.exports = async (remote, message) => {
  console.log('Creating new Place…')
  console.log(message)

  const subdomain = message.domain
  const appIndex = parseInt(message.app)
  const publicKeys = message.publicKeys

  //
  // Validate input.
  //

  // Validate subdomain.
  //
  // According to the pertinent internet recommendations (RFC3986 section 2.2,
  // which in turn refers to: RFC1034 section 3.5 and RFC1123 section 2.1),
  // a subdomain (which is a part of a DNS domain hostname), must meet several requirements:
  //
  // • Each subdomain part must have a length no greater than 63.
  // • Each subdomain part must begin and end with an alpha-numeric (i.e. letters [A-Za-z] or digits [0-9]).
  // • Each subdomain part may contain hyphens (dashes), but may not begin or end with a hyphen.
  //
  // (https://stackoverflow.com/a/7933253)
  const validHostnameCharacters = /^[A-Za-z0-9](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?$/
  if (subdomain.trim() === '' || !validHostnameCharacters.test(subdomain)) {
    return remote.places.create.error.send({ subject: 'validation', error: 'Invalid domain' })
  }

  // Validate app.
  if (appIndex === NaN || appIndex < 0 || appIndex >= db.settings.apps.length) {
    return remote.places.create.error.send({ subject: 'validation', error: 'Invalid app' })
  }

  // Confirm that domain is not already registered.
  if (db.domains[subdomain] !== undefined) {
    return remote.places.create.error.send({ subject: 'validation', error: 'Domain already exists' })
  }

  // Create the domain entry
  db.domains[subdomain] = {
    publicKeys,
    status: 'setup-started'
  }

  // TODO: Handle errors in VPS / DNS service constructors.
  const webHost = new HetznerCloud.Client(db.settings.vps.apiToken)
  const dnsHost = dnsimple({
    accessToken: db.settings.dns.accessToken
  })

  const app = db.settings.apps[appIndex]
  let cloudInit = app.cloudInit
  cloudInit = cloudInit.replace('{{SSH_KEY}}', db.settings.vps.sshKey)
  cloudInit = cloudInit.replace('{{SUBDOMAIN}}', subdomain)

  console.log('Creating app: ', app.name)

  console.log(cloudInit)

  // Create the server and store the returned IP address.
  //
  // Note: while the Hetzner API documentation states that the
  // ===== sshKey provided in the call is optional, if it is not
  //       provided (a) a root password is set (which we don’t want)
  //       and the sudo account creation fails during cloud-config/cloud-init.
  let serverBuildResult
  try {
    serverBuildResult = await webHost.servers.build()
    .name(`${subdomain}.small-web.org`)
    .serverType(db.settings.vps.serverType)
    .location(db.settings.vps.location)
    .image(db.settings.vps.image)
    .sshKey(db.settings.vps.sshKeyName)
    .userData(cloudInit)
    .create()
  } catch (error) {
    console.error('Create server VPS error', error)
    return remote.places.create.error.send({ subject: 'vps', error })
  }

  console.log('serverBuildResult', serverBuildResult)

  // TODO: Check that the response is exactly as we expect it to be.
  // (The shape of the .server and .action properties.)

  if (serverBuildResult.action.status === 'error') {
    db.domains[subdomain].status = `setup-create-server-error`
    return remote.places.create.error.send({ subject: 'vps', error: action.error })
  }

  db.domains[subdomain].status = `setup-server-initialising`

  console.log(' - Server initialising.')

  remote.places.create.progress.send({
    subject: 'vps',
    status: 'initialising',
    progress: serverBuildResult.action.progress,
    finished: serverBuildResult.action.finished
  })

  // We’ve got the initial result that the server is initialising.
  // Before polling for whether that’s complete, let’s also set up
  // the domain entry so we can get that out of the way as soon as
  // possible.

  db.domains[subdomain].status = `setup-dns-initialising`

  console.log(' - Setting up the domain name…')

  remote.places.create.progress.send({ subject: 'dns', status: 'initialising' })

  const publicNet = serverBuildResult.server.publicNet
  const ipv4 = publicNet.ipv4.ip
  const ipv6 = publicNet.ipv6.ip

  // Create an A record for the subdomain that points to the server’s IP address.
  // TODO: ALso create AAAA record for the ipv6
  // Create zone record
  let dnsZoneCreationResponse
  try {
    dnsZoneCreationResponse = await dnsHost.zones.createZoneRecord(
      accountId = db.settings.dns.accountId,
      domainId = db.settings.dns.domain,
      attributes = {name: subdomain, type: 'A', content: ipv4, ttl: 60}
    )
    console.log(dnsZoneCreationResponse)
  } catch (error) {
    console.log('Create server DNS error', error)
    db.domains[subdomain].status = `setup-domain-creation-failed`
    return remote.places.create.error.send({ subject: 'dns', error })
  }

  console.log(' - Domain name created.')

  db.domains[subdomain].status = `setup-domain-created`

  // Poll the returned server creation action and provide progress messages
  // ===== and only continue once progress is 100%.

  let serverBuildSuccess = false
  while (!serverBuildSuccess) {
    const action = await webHost.actions.get(serverBuildResult.action.id)

    if (action.status === 'error') {
      db.domains[subdomain].status = `setup-vps-creation-failed`
      return remote.places.create.error.send({ subject: 'vps', error: action.error })
    }

    remote.places.create.progress.send({
      subject: 'vps',
      status: action.status,
      progress: action.progress,
      finished: action.finished
    })

    serverBuildSuccess = (action.status === 'success')
  }

  db.domains[subdomain].status = `setup-vps-created`

  console.log(' - Server is ready.')

  remote.places.create.response.send({
    subject: 'task',
    status: 'done'
  })

  // That’s it. From here on, it’s up to the client to poll for the domain to become
  // reachable and for the app to complete installing.
}
