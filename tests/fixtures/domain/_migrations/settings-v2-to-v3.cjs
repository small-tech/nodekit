// Migration of Settings table from version 2 to version 3
//
// settings.vps.sshKey becomes settings.vps.sshKeyName
// settings.vps.sshKey is now the actual public key

const fs = require('fs')
const path = require('path')
const JSDB = require('@small-tech/jsdb')

async function migrate () {
  console.log('Migrating settings table from version 2 to version 3.')

  // Backup settings table.
  console.log(' > Backing up existing table…')
  const currentTablePath = path.join('.db', 'settings.cjs')
  const backupTablePath = path.join('.db', 'settings-v2-to-v3-pre-migration-backup.cjs')
  fs.copyFileSync(currentTablePath, backupTablePath)
  console.log(' > Done.')

  console.log(' > Opening database and loading table…')
  const db = JSDB.open('.db')
  const settings = db.settings
  console.log(' > Done.')

  // Is migration necessary?
  if (settings.version && settings.version >= 3) {
    console.log('Already migrated, exiting.')
    process.exit()
  }

  console.log(' > Carrying out migration…')
  // Attempt to migrate.
  try {
    db.settings.vps.sshKeyName = settings.vps.sshKey
    db.settings.vps.sshKey = ''

    // Update version
    db.settings.version = 3
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
