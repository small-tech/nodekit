// Test “binaries” (launch scripts).

import { test } from './helpers/index.js'

import path from 'path'
import { execFileSync } from 'child_process'

import packageInfo from '../package.json'

test('nodekit binary', t => {
  const output = execFileSync(path.resolve('bin/nodekit'), ['--version'], {timeout: 1000})
  t.equals(output.toString().trim(), `NodeKit version ${packageInfo.version}`)
  t.end()
})

// test('nodekit binary (inspect mode)', t => {
//   const output = execFileSync(path.resolve('bin/nodekit-inspect'), ['--version'], {timeout: 1000})
//   t.equals(output.toString().trim(), `NodeKit version ${packageInfo.version}`)
//   t.end()
// })
