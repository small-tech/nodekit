import { test } from './helpers'

import path from 'path'
import { fileURLToPath, URL } from 'url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const fixturesPath = path.join(__dirname, 'fixtures')

import Files from '../lib/Files.js'

function sortResults(filesByExtension, expectedFilesByExtension) {
  // Chokidar’s file system scan does not always return the files in the same order.
  // So we perform a sort on the actual and expected files before comparing them.
  Object.keys(filesByExtension).forEach(extension => {
    filesByExtension[extension].sort()
  })
  Object.keys(expectedFilesByExtension).forEach(extension => {
    expectedFilesByExtension[extension].sort()
  })
  return { filesByExtension, expectedFilesByExtension }
}

test('production', async t => {
  process.env.PRODUCTION = true

  const domainProjectPath = path.join(fixturesPath, 'files')
  const files = new Files(domainProjectPath)

  const unsortedFilesByExtension = await files.initialise()

  // During production, we only care about the files that we serve.
  const unsortedExpectedFilesByExtension = {
    page: [
      "/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/admin/index.page",
      "/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/index.page",
      "/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/manage_[domain].page"
    ],
    socket: [
      "/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/admin/index_[password].socket",
      "/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/index.socket",
      "/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/manage_[token]_[domain].socket"
    ],
    get: [
      "/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/domain/available_[domain].get",
      "/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/domain/ready_[domain].get",
      "/home/aral/Projects/small-web/nodekit/app/tests/fixtures/files/private_[token]_[domain].get"
    ]
  }

  const { filesByExtension, expectedFilesByExtension } = sortResults(unsortedFilesByExtension, unsortedExpectedFilesByExtension)
  t.equals(JSON.stringify(filesByExtension), JSON.stringify(expectedFilesByExtension), 'files grouped by extension as expected (production)')

  delete(process.env.PRODUCTION)
})

test('development', async t => {
  delete(process.env.PRODUCTION)

  const domainProjectPath = path.join(fixturesPath, 'files')
  const files = new Files(domainProjectPath)
  let unsortedFilesByExtension = await files.initialise()

  // During development, we also care about the dependencies of files that we serve so we can
  // implement live reload and CSS injection.
  let unsortedExpectedFilesByExtension = {
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

  const { filesByExtension, expectedFilesByExtension } = sortResults(unsortedFilesByExtension, unsortedExpectedFilesByExtension)
  t.equals(JSON.stringify(filesByExtension), JSON.stringify(expectedFilesByExtension), 'files grouped by extension as expected (development)')

  files.close()
})

test('chokidar error handling', async t => {
  const files = new Files('/')
  await t.rejects(async () => await files.initialise(), /EACCES/, 'attempting to watch root should throw EACCES')
  files.close()
})
