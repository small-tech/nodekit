import fetch from 'node-fetch'

export default async (remote, message) => {
  console.log('   📡️    ❨Domain❩ Validating that domain is on Public Suffix List (PSL).')

  let pslIsValid = false

  // The Public Suffix List requirement for Small Web Domains is only for
  // public instances, not private ones. Private instances are ones where there is no
  // payment type set and where all registrations must be done via the administration
  // interface. For more information on the rationale, please see the PSL tab in the
  // administration interface.
  if (db.settings.payment.provider === 0 /* none */) {
    pslIsValid = true
  }

  // Once a domain is on the PSL, there is very little chance that it will be
  // removed so we can use the cached value here and not download the actual
  // list every time. If necessary, in the future we can add a retry option that
  // forces us to reconnect and check.
  if (db.settings.psl && db.settings.psl.valid) {
    pslIsValid = true
  }

  // If we can determine that the PSL is valid without having to manually
  // verify it, we do so and return.
  if (pslIsValid) {
    return remote.psl.validate.response.send()
  }

  // PSL is not valid, we need to validate it by downloading the PSL
  // and searching for the domain in it.
  const response = await fetch('https://publicsuffix.org/list/public_suffix_list.dat')
  if (response.status !== 200) {
    return remote.psl.validate.error.send({
      error: `Could not download Public Suffix List. (${response.status}: ${response.statusText})`
    })
  }

  const publicSuffixList = await response.text()

  const domainIsOnPublicSuffixList = publicSuffixList.split('\n').includes(db.settings.dns.domain)

  if (!db.settings.psl) {
    db.settings.psl = {}
  }

  if (domainIsOnPublicSuffixList) {
    db.settings.psl.valid = true
    remote.psl.validate.response.send()
  } else {
    db.settings.psl.valid = false
    remote.psl.validate.error.send({
      error: `Domain (${db.settings.dns.domain}) is not on the Public Suffix List (https://publicsuffix.org/list/public_suffix_list.dat).`
    })
  }
}
