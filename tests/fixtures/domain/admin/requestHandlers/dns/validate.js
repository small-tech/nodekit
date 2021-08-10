const validateDns = require('../../validate-dns.cjs')

module.exports = async (remote, message) => {
  console.log('   📡️    ❨Domain❩ Validating DNS Provider settings.')

  let dnsAccountDetails
  try {
    dnsAccountDetails = await validateDns()
    remote.dns.validate.request.respond(message, {
      details: dnsAccountDetails
    })
  } catch (error) {
    remote.dns.validate.request.respond(message, { error: error.message })
  }
}
