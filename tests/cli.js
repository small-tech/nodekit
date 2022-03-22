import { test } from './helpers'

import CLI from '../lib/cli/index.js'
import serveCommand from '../lib/cli/commands/serve.js'
import enableCommand from '../lib/cli/commands/enable.js'

import packageInfo from '../package.json'

let commands = (new CLI()).commands

test('default', t => {
  t.equals(commands.default, 'serve', 'Default command is serve.')
  t.end()
})

test('version', t => {
  t.plan(3)
  t.equals(commands.ver, packageInfo.version, 'CLI version matches package.json version.')

  // Monkey patch process.exit so version() doesn’t actually exit.
  const originalProcessExit = process.exit

  // Monkey patch console.log() so we can check the version being reported.
  const originalConsoleLog = console.log

  console.log = message => {
    // We’re only interested in the first message. Revert console.log().
    console.log = originalConsoleLog
    t.equals(message, `NodeKit version ${packageInfo.version}`)
  }

  process.exit = code => {
    t.equals(code, 0, 'process.exit() is called with success code')
  }

  commands.parse([null, null, '--version'])

  // Revert process.exit().
  process.exit = originalProcessExit
})

test('command handlers exist', t => {
  t.equals(commands.tree.serve.handler, serveCommand, 'Serve command handler exists.')
  t.equals(commands.tree.enable.handler, enableCommand, 'Enable command handler exists.')
  t.end()
})

test('serve handler', t => {
  // TODO
  t.end()
})

test('enable handler', t => {
  // TODO
  t.end()
})
