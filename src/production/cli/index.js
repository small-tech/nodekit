////////////////////////////////////////////////////////////
//
// NodeKit command-line interface (production mode)
//
// Copyright ⓒ 2021-present, Aral Balkan
// Small Technology Foundation
//
// License: AGPL version 3.0.
//
////////////////////////////////////////////////////////////

import sade from 'sade'
import packageInfo from '../../../package.json' assert {type: 'json'}
import serveCommand from './commands/serve.js'

export default class CommandLineInterface {
  constructor () {
    this.commands = sade('nodekit')

    // Overwrite the built-in _version() method called by the Sade version
    // command to format the output and to also manually exit the process
    // otherwise it will hang due to the open broadcast channel between the
    // loader process and the main process.
    this.commands._version = function () { 
      console.log(`NodeKit version ${this.ver} – Production Mode`)
      process.exit(0)
    }

    this.commands
      .version(packageInfo.version)
      .describe('A Small Web server.')
  
    this.commands
      .command('serve [pathToServe]', '', {default: true})
      .option('--working-directory', 'The working directory NodeKit was launched from. Defaults to current directory (.)', '.')
      .describe('Start server as regular process.')
      .action(serveCommand)
  }

  parse (args) {
    this.commands.parse(args)  
  }
}

