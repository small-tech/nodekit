import { test } from './helpers'

import path from 'path'
import { fileURLToPath, URL } from 'url'
import process from 'process'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const fixturesPath = path.join(__dirname, 'fixtures')

const testFixturesDirectory = path.join(process.cwd(), 'tests', 'fixtures')

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
      `${testFixturesDirectory}/files/admin/index.page`,
      `${testFixturesDirectory}/files/index.page`,
      `${testFixturesDirectory}/files/manage_[domain].page`
    ],
    socket: [
      `${testFixturesDirectory}/files/admin/index_[password].socket`,
      `${testFixturesDirectory}/files/index.socket`,
      `${testFixturesDirectory}/files/manage_[token]_[domain].socket`
    ],
    get: [
      `${testFixturesDirectory}/files/domain/available_[domain].get`,
      `${testFixturesDirectory}/files/domain/ready_[domain].get`,
      `${testFixturesDirectory}/files/private_[token]_[domain].get`
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
      `${testFixturesDirectory}/files/index.page`,
      `${testFixturesDirectory}/files/manage_[domain].page`,
      `${testFixturesDirectory}/files/admin/index.page`
    ],
    socket: [
      `${testFixturesDirectory}/files/index.socket`,
      `${testFixturesDirectory}/files/manage_[token]_[domain].socket`,
      `${testFixturesDirectory}/files/admin/index_[password].socket`
    ],
    get: [
      `${testFixturesDirectory}/files/private_[token]_[domain].get`,
      `${testFixturesDirectory}/files/domain/available_[domain].get`,
      `${testFixturesDirectory}/files/domain/ready_[domain].get`
    ],
    component: [
      `${testFixturesDirectory}/files/admin/places/Index.component`,
      `${testFixturesDirectory}/files/admin/setup/Apps.component`,
      `${testFixturesDirectory}/files/admin/setup/DNS.component`,
      `${testFixturesDirectory}/files/admin/setup/Index.component`,
      `${testFixturesDirectory}/files/admin/setup/Organisation.component`,
      `${testFixturesDirectory}/files/admin/setup/PSL.component`,
      `${testFixturesDirectory}/files/admin/setup/StatusMessage.component`,
      `${testFixturesDirectory}/files/admin/setup/VPS.component`,
      `${testFixturesDirectory}/files/admin/setup/payment/Index.component`,
      `${testFixturesDirectory}/files/admin/setup/payment/None.component`,
      `${testFixturesDirectory}/files/admin/setup/payment/Tokens.component`,
      `${testFixturesDirectory}/files/admin/setup/payment/Stripe/Index.component`,
      `${testFixturesDirectory}/files/admin/setup/payment/Stripe/Mode.component`
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
