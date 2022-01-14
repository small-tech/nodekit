import validateDns from '../../validate-dns.js'

export default async (remote, message) => {
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
