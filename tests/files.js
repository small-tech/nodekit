import { test } from './helpers'

import path from 'path'
import { fileURLToPath, URL } from 'url'
import process from 'process'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const fixturesPath = path.join(__dirname, 'fixtures')

const testFixturesDirectory = path.join(process.cwd(), 'tests', 'fixtures')

import Files from '../lib/Files.js'

function sort(filesByExtension) {
  // Chokidar’s file system scan does not always return the files in the same order.
  // So we perform a sort before comparing them.
  return Object.keys(filesByExtension).forEach(extension => {
    filesByExtension[extension].sort()
  })
}

test('production', async t => {
  process.env.PRODUCTION = true

  const domainProjectPath = path.join(fixturesPath, 'files')
  const files = new Files(domainProjectPath)

  const allFileCollections = await files.initialise()

  const expectedBackendRouteFilesByExtension = sort({
    socket: [
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/index.socket',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/manage_[token]_[domain].socket',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/admin/index_[password].socket'
    ],
    get: [
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/private_[token]_[domain].get',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/domain/available_[domain].get',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/domain/ready_[domain].get'
    ]
  }) 
  
  const expectedFrontendRouteFilesByExtension = sort({
    page: [
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/index.page',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/manage_[domain].page',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/admin/index.page'
    ]
  })
  
  const expectedAllRouteFilesByExtension = sort(Object.assign({}, expectedBackendRouteFilesByExtension, expectedFrontendRouteFilesByExtension))
  
  const expectedDependencyFilesByExtension = sort({
    js: [
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/library/Constants.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/library/StripeCurrencies.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/library/debounce.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/library/dummyData.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/library/getConfig.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/library/keys.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/library/stretchy.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/library/utils.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/admin/library/initial-settings.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/admin/library/validate-dns.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/admin/setup/ServiceState.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/admin/setup/validateDns.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/library/Checkbox/createStyle.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/library/Checkbox/index.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/library/JSDB/DataProxy.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/library/JSDB/IncompleteQueryProxy.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/library/JSDB/JSDF.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/library/JSDB/QueryOperators.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/library/JSDB/QueryProxy.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/library/JSDB/QuerySanitiser.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/library/JSDB/Util.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/library/TabbedInterface/index.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/admin/library/requestHandlers/database/update.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/admin/library/requestHandlers/dns/validate.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/admin/library/requestHandlers/places/create.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/admin/library/requestHandlers/places/waitForServerResponse.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/admin/library/requestHandlers/psl/validate.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/admin/library/requestHandlers/vps/validate.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/admin/library/requestHandlers/paymentProviders/stripe/objects/get.js',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/admin/library/requestHandlers/paymentProviders/stripe/secretKey/validate.js'
    ],
    svelte: [
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/library/DomainChecker.svelte',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/library/Modal.svelte',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/library/SensitiveTextInput.svelte',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/library/Checkbox/Checkbox.svelte',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/library/TabbedInterface/Tab.svelte',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/library/TabbedInterface/TabList.svelte',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/library/TabbedInterface/TabPanel.svelte',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/library/TabbedInterface/TabbedInterface.svelte'
    ],
    component: [
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/admin/places/Index.component',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/admin/setup/Apps.component',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/admin/setup/DNS.component',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/admin/setup/Index.component',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/admin/setup/Organisation.component',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/admin/setup/PSL.component',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/admin/setup/StatusMessage.component',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/admin/setup/VPS.component',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/admin/setup/payment/Index.component',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/admin/setup/payment/None.component',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/admin/setup/payment/Tokens.component',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/admin/setup/payment/Stripe/Index.component',
      '/var/home/aral/Projects/nodekit/tests/fixtures/files/admin/setup/payment/Stripe/Mode.component'
    ]
  })

  

  t.equals(JSON.stringify(sort(allFileCollections.all)), JSON.stringify(expectedAllRouteFilesByExtension), 'all route files as expected')
  t.equals(JSON.stringify(sort(allFileCollections.backend)), JSON.stringify(expectedBackendRouteFilesByExtension), 'backend route files as expected')
  t.equals(JSON.stringify(sort(allFileCollections.frontend)), JSON.stringify(expectedFrontendRouteFilesByExtension), 'frontend route files as expected')
  t.equals(JSON.stringify(sort(allFileCollections.all)), JSON.stringify(expectedDependencyFilesByExtension), 'all dependency files as expected')

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

  const { filesByExtension, expectedFilesByExtension } = sort(unsortedFilesByExtension, unsortedExpectedFilesByExtension)
  t.equals(JSON.stringify(filesByExtension), JSON.stringify(expectedFilesByExtension), 'files grouped by extension as expected (development)')

  files.close()
})

test('chokidar error handling', async t => {
  const files = new Files('/')
  await t.rejects(async () => await files.initialise(), /EACCES/, 'attempting to watch root should throw EACCES')
  files.close()
})
