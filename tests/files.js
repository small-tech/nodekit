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

test('base path', async () => {
  const emptyProjectPath = path.join(fixturesPath, 'emptyProject')
  const emptyProjectFiles = new Files(emptyProjectPath)

  assert.equal(emptyProjectFiles.basePath, emptyProjectPath, 'basePath is set correctly without src folder')

  const emptyProjectWithSrcFolderPath = path.join(fixturesPath, 'emptyProjectWithSrcFolder')
  const emptyProjectWithSrcFolderFiles = new Files(emptyProjectWithSrcFolderPath)
  const expectedBasePath = path.join(emptyProjectWithSrcFolderPath, 'src')

  assert.equal(emptyProjectWithSrcFolderFiles.basePath, expectedBasePath, 'basePath is set correctly when src folder exists')
})

test('initialisation', async context => {
  const domainProjectPath = path.join(fixturesPath, 'domain')
  context.files = new Files(domainProjectPath)
  const filesByExtension = await context.files.initialise()

  const expectedFilesByExtension = {
    'layout': [
      `${fixturesPath}/domain/Page.layout`
    ],
    'css': [
      `${fixturesPath}/domain/index.css`
    ],
    'html': [
      `${fixturesPath}/domain/index.html`
    ],
    'page': [
      `${fixturesPath}/domain/index.page`,
      `${fixturesPath}/domain/manage_[domain].page`,
      `${fixturesPath}/domain/admin/index.page`
    ],
    'socket': [
      `${fixturesPath}/domain/index.socket`,
      `${fixturesPath}/domain/manage_[token]_[domain].socket`,
      `${fixturesPath}/domain/admin/index_[password].socket`
    ],
    'get': [
      `${fixturesPath}/domain/private_[token]_[domain].get`,
      `${fixturesPath}/domain/domain/available_[domain].get`,
      `${fixturesPath}/domain/domain/ready_[domain].get`
    ],
    'ico': [
      `${fixturesPath}/domain/#static/favicon.ico`
    ],
    'txt': [
      `${fixturesPath}/domain/#static/robots.txt`
    ],
    'cjs': [
      `${fixturesPath}/domain/#static/routes.cjs`,
      `${fixturesPath}/domain/_middleware/allow-all-cors.cjs`,
      `${fixturesPath}/domain/_migrations/settings-v1-to-v2.cjs`,
      `${fixturesPath}/domain/_migrations/settings-v2-to-v3.cjs`,
      `${fixturesPath}/domain/_migrations/settings-v3-to-v4.cjs`,
      `${fixturesPath}/domain/_migrations/settings-v4-to-v5.cjs`,
      `${fixturesPath}/domain/_migrations/settings-v5-to-v6.cjs`
    ],
    'svg': [
      `${fixturesPath}/domain/#static/site.js.svg`
    ],
    'png': [
      `${fixturesPath}/domain/#static/small-web.png`
    ],
    'js': [
      `${fixturesPath}/domain/admin/initial-settings.js`,
      `${fixturesPath}/domain/admin/validate-dns.js`,
      `${fixturesPath}/domain/library/Constants.js`,
      `${fixturesPath}/domain/library/StripeCurrencies.js`,
      `${fixturesPath}/domain/library/debounce.js`,
      `${fixturesPath}/domain/library/dummyData.js`,
      `${fixturesPath}/domain/library/getConfig.js`,
      `${fixturesPath}/domain/library/keys.js`,
      `${fixturesPath}/domain/library/stretchy.js`,
      `${fixturesPath}/domain/library/utils.js`,
      `${fixturesPath}/domain/admin/setup/ServiceState.js`,
      `${fixturesPath}/domain/admin/setup/validateDns.js`,
      `${fixturesPath}/domain/library/Checkbox/createStyle.js`,
      `${fixturesPath}/domain/library/Checkbox/index.js`,
      `${fixturesPath}/domain/library/JSDB/DataProxy.js`,
      `${fixturesPath}/domain/library/JSDB/IncompleteQueryProxy.js`,
      `${fixturesPath}/domain/library/JSDB/JSDF.js`,
      `${fixturesPath}/domain/library/JSDB/QueryOperators.js`,
      `${fixturesPath}/domain/library/JSDB/QueryProxy.js`,
      `${fixturesPath}/domain/library/JSDB/QuerySanitiser.js`,
      `${fixturesPath}/domain/library/JSDB/Util.js`,
      `${fixturesPath}/domain/library/TabbedInterface/index.js`,
      `${fixturesPath}/domain/admin/requestHandlers/database/update.js`,
      `${fixturesPath}/domain/admin/requestHandlers/dns/validate.js`,
      `${fixturesPath}/domain/admin/requestHandlers/places/create.js`,
      `${fixturesPath}/domain/admin/requestHandlers/places/waitForServerResponse.js`,
      `${fixturesPath}/domain/admin/requestHandlers/psl/validate.js`,
      `${fixturesPath}/domain/admin/requestHandlers/vps/validate.js`,
      `${fixturesPath}/domain/admin/requestHandlers/paymentProviders/stripe/objects/get.js`,
      `${fixturesPath}/domain/admin/requestHandlers/paymentProviders/stripe/secretKey/validate.js`
    ],
    'svelte': [
      `${fixturesPath}/domain/library/DomainChecker.svelte`,
      `${fixturesPath}/domain/library/Modal.svelte`,
      `${fixturesPath}/domain/library/SensitiveTextInput.svelte`,
      `${fixturesPath}/domain/library/Checkbox/Checkbox.svelte`,
      `${fixturesPath}/domain/library/TabbedInterface/Tab.svelte`,
      `${fixturesPath}/domain/library/TabbedInterface/TabList.svelte`,
      `${fixturesPath}/domain/library/TabbedInterface/TabPanel.svelte`,
      `${fixturesPath}/domain/library/TabbedInterface/TabbedInterface.svelte`
    ],
    'component': [
      `${fixturesPath}/domain/admin/places/Index.component`,
      `${fixturesPath}/domain/admin/setup/Apps.component`,
      `${fixturesPath}/domain/admin/setup/DNS.component`,
      `${fixturesPath}/domain/admin/setup/Index.component`,
      `${fixturesPath}/domain/admin/setup/Organisation.component`,
      `${fixturesPath}/domain/admin/setup/PSL.component`,
      `${fixturesPath}/domain/admin/setup/StatusMessage.component`,
      `${fixturesPath}/domain/admin/setup/VPS.component`,
      `${fixturesPath}/domain/admin/setup/payment/Index.component`,
      `${fixturesPath}/domain/admin/setup/payment/None.component`,
      `${fixturesPath}/domain/admin/setup/payment/Tokens.component`,
      `${fixturesPath}/domain/admin/setup/payment/Stripe/Index.component`,
      `${fixturesPath}/domain/admin/setup/payment/Stripe/Mode.component`
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

test('chokidar error handling', async context => {
  context.files = new Files('/')
  await assert.rejects(async () => context.files.initialise(), /EACCES/, 'attempting to watch root should throw EACCES')
})

test.run()
