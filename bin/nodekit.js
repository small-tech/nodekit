import sade from 'sade'

import fs from 'fs'
import path from 'path'
import NodeKit from '../index.js'

import packageInfo from '../package.json' assert { type: 'json' }

const app = sade('nodekit')

app
  .version(packageInfo.version)
  .describe('A Small Web server.')

app
  .command('serve [pathToServe]', '', {default: true})
  .option('--base-path', 'The path pathToServe is relative to', '/')
  .describe('Start server as regular process.')
  .action(async (pathToServe, options) => {
    // Resolve the path to serve so that it works both when run as
    // nodekit <path to serve> from anywhere and, from the source folder, as
    // bin/nodekit <path to serve>.
    const _basePath = options['base-path'] === '/' ? '.' : options['base-path']
    const _pathToServe = pathToServe === undefined ? '.' : pathToServe
    const absolutePathToServe = path.resolve(_basePath, _pathToServe)

    if (!fs.existsSync(absolutePathToServe)) {
      console.error(`${absolutePathToServe} not found.`)
      process.exit(1)
    }

    console.verbose('Starting NodeKit…')
    console.verbose('Serving', absolutePathToServe)
    const nodeKit = new NodeKit(absolutePathToServe)
    await nodeKit.initialise()
  })

app
  .command('enable')
  .describe('Install server systemd service and start it at hostname using globally-trusted TLS certificates.')
  .option('--skip-domain-reachability-check', 'Do not run pre-flight check for domain reachability.')
  .action(options => {
    console.warn('enable: unimplemented', options)
  })

app.parse(process.argv)
