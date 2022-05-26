////////////////////////////////////////////////////////////
//
// NodeKit command-line interface (args)
//
// Copyright ⓒ 2021-present, Aral Balkan
// Small Technology Foundation
//
// License: AGPL version 3.0.
//
////////////////////////////////////////////////////////////

import sade from 'sade'
import packageInfo from '../../package.json' assert {type: 'json'}

import serveCommand from './commands/serve.js'
import enableCommand from './commands/enable.js'


export default class CommandLineInterface {
  constructor () {
    this.commands = sade('nodekit')

    // Overwrite the built-in _version() method called by the Sade version
    // command to format the output and to also manually exit the process
    // otherwise it will hang due to the open broadcast channel between the
    // loader process and the main process.
    this.commands._version = function () { 
      console.log(`NodeKit version ${this.ver}`)
      process.exit(0)
    }

    this.commands
      .version(packageInfo.version)
      .describe('A Small Web server.')
  
    this.commands
      .command('serve [pathToServe]', '', {default: true})
      .option('--base-path', 'The path pathToServe is relative to', '/')
      .describe('Start server as regular process.')
      .action(serveCommand)
    
    this.commands
      .command('enable')
      .describe('Install server systemd service and start it at hostname using globally-trusted TLS certificates.')
      .option('--skip-domain-reachability-check', 'Do not run pre-flight check for domain reachability.')
      .action(enableCommand)
  }

  parse (args) {
    this.commands.parse(args)  
  }
}
