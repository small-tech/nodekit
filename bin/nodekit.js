import sade from 'sade'

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))

import Files from '../lib/Files.js'

import packageInfo from '../package.json'

const app = sade('nodekit')

app
  .version(packageInfo.version)
  .describe('An opinionated Small Web server.')

app
  .command('serve [basePath]', '', {default: true})
  .describe('Start server as regular process.')
  .action(async (basePath, options) => {

    if (!fs.existsSync(basePath)) {
      console.error(`${basePath} not found.`)
      process.exit(1)
    }

    console.log('Starting NodeKit server…')
    const absoluteBasePath = path.resolve(basePath)
    console.log('Serving', absoluteBasePath)
    const files = new Files(absoluteBasePath)
    await files.initialise()
  })

app
  .command('enable')
  .describe('Install server systemd service and start it at hostname using globally-trusted TLS certificates.')
  .option('--skip-domain-reachability-check', 'Do not run pre-flight check for domain reachability.')
  .action(options => {
    console.log('enable: unimplemented', options)
  })

app.parse(process.argv)
