const fetch = require('node-fetch')
const { dns } = require('./initial-settings.cjs')

module.exports = async () => {
  if (db.settings.dns.accountId === '') {
    throw new Error('DNSimple account ID not set.')
  }

  if (db.settings.dns.domain === '') {
    throw new Error('Domain not set.')
  }

  const retrieveDomainUrl = `https://api.dnsimple.com/v2/${db.settings.dns.accountId}/domains/${db.settings.dns.domain}`
  const dnsAccountDetails = await (await fetch(retrieveDomainUrl, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${db.settings.dns.accessToken}`
    }
  })).json()

  if (dnsAccountDetails.message) {
    // Something went wrong (most likely an authentication failure)
    throw new Error(dnsAccountDetails.message)
  }

  return dnsAccountDetails
}
