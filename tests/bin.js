// Test “binaries” (launch scripts).

import { suite } from 'uvu'
import * as assert from 'uvu/assert'

import path from 'path'
import { execFileSync } from 'child_process'

import packageInfo from '../package.json'

const test = suite('bin')

test('nodekit binary', () => {
  const output = execFileSync(path.resolve('bin/nodekit'), ['--version'], {timeout: 1000})
  assert.equal(output.toString().trim(), `NodeKit version ${packageInfo.version}`)
})

test('nodekit binary (inspect mode)', () => {
  const output = execFileSync(path.resolve('bin/nodekit-inspect'), ['--version'], {timeout: 1000})
  assert.equal(output.toString().trim(), `NodeKit version ${packageInfo.version}`)
})

test.run()
