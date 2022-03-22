import { test } from './helpers'

import path from 'path'
import { fileURLToPath, URL } from 'url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const fixturesPath = path.join(__dirname, 'fixtures')

import Files from '../lib/Files.js'

test('initialisation', async t => {
  const domainProjectPath = path.join(fixturesPath, 'files')
  const files = new Files(domainProjectPath)

  const filesByExtension = await files.initialise()

  const expectedFilesByExtension = {
    page: [
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/index.page',
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/manage_[domain].page',
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/admin/index.page'
    ],
    socket: [
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/index.socket',
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/manage_[token]_[domain].socket',
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/admin/index_[password].socket'
    ],
    get: [
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/private_[token]_[domain].get',
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/domain/available_[domain].get',
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/domain/ready_[domain].get'
    ],
    component: [
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/admin/places/Index.component',
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/admin/setup/Apps.component',
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/admin/setup/DNS.component',
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/admin/setup/Index.component',
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/admin/setup/Organisation.component',
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/admin/setup/PSL.component',
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/admin/setup/StatusMessage.component',
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/admin/setup/VPS.component',
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/admin/setup/payment/Index.component',
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/admin/setup/payment/None.component',
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/admin/setup/payment/Tokens.component',
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/admin/setup/payment/Stripe/Index.component',
      '/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/admin/setup/payment/Stripe/Mode.component'
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

  t.equals(JSON.stringify(filesByExtension), JSON.stringify(expectedFilesByExtension), 'files grouped by extension as expected')

  files.close()
})

// test('chokidar error handling', async context => {
//   const files = new Files('/')
//   await assert.rejects(async () => files.initialise(), /EACCES/, 'attempting to watch root should throw EACCES')
// })
