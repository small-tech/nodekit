import { suite } from 'uvu'
import * as assert from 'uvu/assert'

import path from 'path'
import { fileURLToPath, URL } from 'url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const fixturesPath = path.join(__dirname, 'fixtures')

import Files from '../lib/Files.js'

const test = suite('Files')

// After each test, close the Files instance if it exists
// so our test process can exit properly regardless of
// whether there is an error. (Because uvu works with thrown
// errors, if a long-running process is created in a test
// method, it is not cleaned up if a test fails as the clean-up
// code is unreachable.)
test.after.each(async context => {
  if (context.files) {
    await context.files.close()
  }
})

test('initialisation', async context => {
  const domainProjectPath = path.join(fixturesPath, 'domain')
  context.files = new Files(domainProjectPath)

  const filesByExtension = await context.files.initialise()

  console.log(filesByExtension)

  const expectedFilesByExtension = {
    page: [
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/domain/index.page',
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/domain/manage_[domain].page',
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/domain/admin/index.page'
    ],
    socket: [
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/domain/index.socket',
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/domain/manage_[token]_[domain].socket',
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/domain/admin/index_[password].socket'
    ],
    get: [
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/domain/private_[token]_[domain].get',
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/domain/domain/available_[domain].get',
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/domain/domain/ready_[domain].get'
    ]
  }

  // Note: Chokidar’s file system scan does not always return the files in the same order.
  // ===== So we perform a sort on the actual and expected files before comparing them.
  Object.keys(expectedFilesByExtension).forEach(extension => {
    expectedFilesByExtension[extension].sort()
  })
  Object.keys(filesByExtension).forEach(extension => {
    filesByExtension[extension].sort()
  })

  assert.equal(filesByExtension, expectedFilesByExtension, 'files grouped by extension as expected')
})

// test('chokidar error handling', async context => {
//   context.files = new Files('/')
//   await assert.rejects(async () => context.files.initialise(), /EACCES/, 'attempting to watch root should throw EACCES')
// })

test.run()
