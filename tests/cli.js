import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import CLI from '../lib/cli/index.js'
import serveCommand from '../lib/cli/commands/serve.js'
import enableCommand from '../lib/cli/commands/enable.js'

import { standardOutput } from './helpers'

import packageInfo from '../package.json'

const test = suite('CLI')

let commands = (new CLI()).commands

test('default', () => {
  assert.equal(commands.default, 'serve', 'Default command is serve.')
})

test('version', () => {
  assert.equal(commands.ver, packageInfo.version, 'CLI version matches package.json version.')

  standardOutput.capture()
  commands.parse([null, null, '--version'])
  standardOutput.stopCapturing()

  assert.equal(standardOutput.capturedContents.trim(), `nodekit, ${packageInfo.version}`, 'Version command output is as expected.')
})

test('command handlers exist', () => {
  assert.equal(commands.tree.serve.handler, serveCommand, 'Serve command handler exists.')
  assert.equal(commands.tree.enable.handler, enableCommand, 'Enable command handler exists.')
})

test('serve handler', () => {
  // TODO
})

test('enable handler', () => {
  // TODO
})

test.run()
