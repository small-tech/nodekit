import { test } from './helpers'

import path from 'path'
import { fileURLToPath, URL } from 'url'
import process from 'process'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const fixturesPath = path.join(__dirname, 'fixtures')

const testFixturesDirectory = path.join(process.cwd(), 'tests', 'fixtures')

import Files from '../src/production/Files'

function sort(filesByExtension) {
  // Chokidar’s file system scan does not always return the files in the same order.
  // So we perform a sort before comparing them.
  Object.keys(filesByExtension).forEach(extension => {
    filesByExtension[extension].sort()
  })
  return filesByExtension
}

test('production', async t => {
  process.env.PRODUCTION = true
  
  process.env.basePath = path.join(fixturesPath, 'files')

  const files = new Files()
  const filesByExtensionCategoryType = await files.initialise()

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
  
  const expectedAllRouteFilesByExtension = sort(Object.assign({}, expectedFrontendRouteFilesByExtension, expectedBackendRouteFilesByExtension))
  
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

  t.equals(JSON.stringify(sort(filesByExtensionCategoryType.allRoutes)), JSON.stringify(expectedAllRouteFilesByExtension), 'all route files as expected')
  t.equals(JSON.stringify(sort(filesByExtensionCategoryType.backendRoutes)), JSON.stringify(expectedBackendRouteFilesByExtension), 'backend route files as expected')
  t.equals(JSON.stringify(sort(filesByExtensionCategoryType.frontendRoutes)), JSON.stringify(expectedFrontendRouteFilesByExtension), 'frontend route files as expected')
  t.equals(JSON.stringify(sort(filesByExtensionCategoryType.dependencies)), JSON.stringify(expectedDependencyFilesByExtension), 'all dependency files as expected')

  delete(process.env.PRODUCTION)
})

test('development', async t => {
  delete(process.env.PRODUCTION)

  const domainProjectPath = path.join(fixturesPath, 'files')
  const files = new Files(domainProjectPath)
  let allFileCollections = await files.initialise()

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

  const expectedAllRouteFilesByExtension = sort(Object.assign({}, expectedFrontendRouteFilesByExtension, expectedBackendRouteFilesByExtension))

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
  t.equals(JSON.stringify(sort(allFileCollections.dependency)), JSON.stringify(expectedDependencyFilesByExtension), 'all dependency files as expected')

  files.close()
})

test('chokidar error handling', async t => {
  const files = new Files('/')
  await t.rejects(async () => await files.initialise(), /EACCES/, 'attempting to watch root should throw EACCES')
  files.close()
})
