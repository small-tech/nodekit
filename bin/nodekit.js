#!/usr/bin/env node

import sade from 'sade'

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))

const packageInfo = JSON.parse(fs.readFileSync(path.normalize(path.join(__dirname, '..', 'package.json')), 'utf-8'))

const app = sade('nodekit')

app
  .version(packageInfo.version)
  .describe('An opinionated Small Web server.')

app
  .command('serve', '', {default: true})
  .describe('Start server as regular process.')
  .action(options => {
    console.log('Serving…')
  })

app
  .command('enable')
  .describe('Install server systemd service and start it at hostname using globally-trusted TLS certificates.')
  .option('--skip-domain-reachability-check', 'Do not run pre-flight check for domain reachability.')
  .action(options => {
    console.log('enable: unimplemented', options)
  })

app.parse(process.argv)
