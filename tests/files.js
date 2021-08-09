import { suite } from 'uvu'
import * as assert from 'uvu/assert'

import path from 'path'
import { fileURLToPath, URL } from 'url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const fixturesPath = path.join(__dirname, 'fixtures')

import Files from '../lib/Files.js'

const test = suite('Files')

test('base path', async () => {
  const emptyProjectPath = path.join(fixturesPath, 'emptyProject')
  const emptyProjectFiles = new Files(emptyProjectPath)

  assert.equal(emptyProjectFiles.basePath, emptyProjectPath, 'basePath is set correctly without src folder')

  const emptyProjectWithSrcFolderPath = path.join(fixturesPath, 'emptyProjectWithSrcFolder')
  const emptyProjectWithSrcFolderFiles = new Files(emptyProjectWithSrcFolderPath)
  const expectedBasePath = path.join(emptyProjectWithSrcFolderPath, 'src')

  assert.equal(emptyProjectWithSrcFolderFiles.basePath, expectedBasePath, 'basePath is set correctly when src folder exists')
})

test.run()
