// Migration of Settings table from version 3 to version 4
//
// - remove cloudInit property on vps settings
// - add apps list
// - add original cloud init as Site.js app to apps
//

const fs = require('fs')
const path = require('path')
const JSDB = require('@small-tech/jsdb')

const oldVersion = 5
const newVersion = 6

async function migrate () {
  console.log(`Migrating settings table from version ${oldVersion} to version ${newVersion}.`)

  // Backup settings table.
  console.log(' > Backing up existing table…')
  const currentTablePath = path.join('.db', 'settings.cjs')
  const backupTablePath = path.join('.db', `settings-v${oldVersion}-to-v${newVersion}-pre-migration-backup.cjs`)
  fs.copyFileSync(currentTablePath, backupTablePath)
  console.log(' > Done.')

  console.log(' > Opening database and loading table…')
  const db = JSDB.open('.db')
  const settings = db.settings
  console.log(' > Done.')

  // Is migration necessary?
  if (settings.version && settings.version >= newVersion) {
    console.log('Already migrated, exiting.')
    process.exit()
  }

  console.log(' > Carrying out migration…')
  // Attempt to migrate.
  try {
    // Migration

    const stripe = db.settings.payment.providers[2]

    // Currency now using currency code
    stripe.currency = 'eur'

    // Amount is no longer used (use price)
    delete stripe.amount

    // Currency and price are not kept in the mode details.
    delete stripe.modeDetails[0].currency
    delete stripe.modeDetails[0].amount

    // Update version
    db.settings.version = newVersion
  } catch (error) {
    console.log('Migration encountered an error and cannot proceed.', error)
    console.log(' > Closing database…')
    await db.close()
    console.log(' > Done.')
    console.log(' > Reverting changes.')
    fs.copyFileSync(backupTablePath, currentTablePath)
    console.log(' > Done.')
    process.exit()
  }
  console.log(' > Done.')

  // Delete the backup file.
  console.log(' > Deleting backup file.')
  fs.unlinkSync(backupTablePath)
  console.log(' > Done.')

  console.log(' > Migration successful.')
}

migrate()
