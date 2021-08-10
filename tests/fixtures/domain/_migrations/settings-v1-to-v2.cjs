// Migration of Settings table from version 1 to version 2
// The payment providers are now an array instead of an object
// and pre-populated with the defaults for the None and Token
// provider types.
//
// Also, adds the version attribute for the first time, thereby
// enabling migrations.

const fs = require('fs')
const path = require('path')
const JSDB = require('@small-tech/jsdb')

async function migrate () {
  console.log('Migrating settings table from version 1 to version 2.')

  // Backup settings table.
  console.log(' > Backing up existing table…')
  const currentTablePath = path.join('.db', 'settings.cjs')
  const backupTablePath = path.join('.db', 'settings-v1-to-v2-pre-migration-backup.cjs')
  fs.copyFileSync(currentTablePath, backupTablePath)
  console.log(' > Done.')

  console.log(' > Opening database and loading table…')
  const db = JSDB.open('.db')
  const settings = db.settings
  console.log(' > Done.')

  // Is migration necessary?
  if (db.settings.version && db.settings.version >= 2) {
    console.log('Already migrated, exiting.')
    process.exit()
  }

  console.log(' > Carrying out migration…')
  // Attempt to migrate.
  try {
    // Add version to settings table.
    settings.version = 2

    // Migrate the payment object to an array, copying over the Stripe-related
    // details in version 1.
    const payment = settings.payment

    settings.payment = {
      // Set the payment provider to the index of the only one that existed previously (Stripe).
      provider: 2,

      // Create the providers array.
      providers: [
        {
          name: 'None',
          modes: null
        },
        {
          name: 'Tokens',
          modes: null,
          codes: []
        },
        {
          name: 'Stripe',
          modes: [ 'test', 'live' ],
          mode: payment.mode,
          modeDetails: payment.modeDetails,
          currency: payment.currency,
          price: payment.price,
          amount: payment.amount
        }
      ]
    }
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
