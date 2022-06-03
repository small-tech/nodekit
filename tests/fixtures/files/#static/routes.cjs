const crypto = require('crypto')

module.exports = app => {

  // We’re (ab)using the custom routes feature in Site.js as
  // an entry-point to perform global initialisation.

  if (db.admin === undefined) {
    db.admin = {}
    // Create a cryptographically-secure path for the admin route.
    db.admin.password = crypto.randomBytes(16).toString('hex')
  }

  console.log(`   🔑️    ❨Domain❩ Admin password is ${db.admin.password}`)
}
