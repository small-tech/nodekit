import path from 'path'
import { test } from './helpers'
import { context, resolve, load } from '../lib/processes/loader'
import fsPromises from 'fs/promises'
import fs from 'fs'
import os from 'os'

const originalCompileSource = context.compileSource
const originalDirName = context.__dirname
const homeDirectory = os.homedir()

test('Svelte source compiler (compileSource)', async t => {
  // Ensure the aspects of the context we’re testing are in place.
  context.compileSource = originalCompileSource
  context.fsPromises = fsPromises
  context.__dirname = process.cwd()

  const pageToCompile = path.join(process.cwd(), 'examples', 'components', 'index.page')
  const result = (await context.compileSource(pageToCompile)).replace(/\s|\n/g, '')

  const expectedResult = (fs.readFileSync(path.join(process.cwd(), 'tests', 'fixtures', 'compiled', 'components-index-page.js'), 'utf-8')).replace(/\s|\n/g, '')

  t.equals(result, expectedResult)

  context.__dirname = originalDirName
})

test('resolve', async t => {
  // The context conditions passed during resolution.
  const conditions = [ 'node', 'import', 'node-addons' ]

  // Paths/URLs used in the tests.
  // Gathered from a run of Domain (https://github.com/small-tech/domain).
  const nodeKitBaseUrl = `file://${homeDirectory}/.small-tech.org/nodekit/app`
  const appBaseUrl = `file://${homeDirectory}/Projects/small-web/domain`
  const nodeKitBundleUrl = `${nodeKitBaseUrl}/nodekit-bundle.js`
  const adminIndexPagePath = `${homeDirectory}/Projects/small-web/domain/admin/index.page`
  const adminIndexPageFileUrlWithCacheBusterQueryString = `file://${adminIndexPagePath}?16480312632870.029349449465893684`
  const placesComponentFileUrl = `${appBaseUrl}/admin/places/Index.component?16480312651970.2189263663664751`
  const domainCheckerComponentFileUrl = `${appBaseUrl}/library/DomainChecker.svelte`
  const paymentBaseFileUrl = `file://${homeDirectory}/Projects/small-web/domain/admin/setup/payment`

  const defaultResolve = 'expect-default-resolve'

  const resolutions = [
    // The NodeKit bundle itself.
    {
      specifier: nodeKitBundleUrl,
      parentURL: undefined,
      resolvesTo: defaultResolve
    },

    // An internal node package.
    {
      specifier: 'module',
      parentURL: nodeKitBundleUrl,
      resolvesTo: defaultResolve
    },

    // A page from within the app/site being served.
    {
      specifier: adminIndexPagePath,
      parentURL: nodeKitBundleUrl,
      resolvesTo: `file://${adminIndexPagePath}`
    },

    // svelte resolution to svelte version packaged within NodeKit itself.
    {
      specifier: 'svelte',
      parentURL: adminIndexPageFileUrlWithCacheBusterQueryString,
      resolvesTo: `${nodeKitBaseUrl}/node_modules/svelte/ssr.mjs`
    },

    // svelte/internal resolution to svelte version packaged within NodeKit itself.
    {
      specifier: 'svelte/internal',
      parentURL: adminIndexPageFileUrlWithCacheBusterQueryString,
      resolvesTo: `${nodeKitBaseUrl}/node_modules/svelte/internal/index.mjs`
    },

    // An internal Node package imported by the app/site being served.
    {
      specifier: 'buffer',
      parentURL: adminIndexPageFileUrlWithCacheBusterQueryString,
      resolvesTo: defaultResolve
    },

    // svelte/transition imported from a component in the app/site.
    {
      specifier: 'svelte/transition',
      parentURL: placesComponentFileUrl,
      resolvesTo: `${nodeKitBaseUrl}/node_modules/svelte/transition/index.mjs`
    },

    // A third-party regular Node module imported from a component in the app/site.
    {
      specifier: '@small-tech/spinners',
      parentURL: placesComponentFileUrl,
      resolvesTo: defaultResolve
    },

    // A component imported from another component in the app/site using a relative path (svelte extension).
    {
      specifier: '../../library/DomainChecker.svelte',
      parentURL: placesComponentFileUrl,
      resolvesTo: domainCheckerComponentFileUrl
    },

    // A component imported from another component in the app/site using a relative path (component extension).
    {
      specifier: './Tokens.component',
      parentURL: `${paymentBaseFileUrl}/Index.component`,
      resolvesTo: `${paymentBaseFileUrl}/Tokens.component`
    },

    // An internal svelte relative import.
    {
      specifier: '../internal/index.mjs',
      parentURL: `${nodeKitBaseUrl}/node_modules/svelte/transition/index.mjs`,
      resolvesTo: `${nodeKitBaseUrl}/node_modules/svelte/internal/index.mjs`
    },

    // Loading one module from another with a relative specifier in the app/site.
    {
      specifier: './Util.js',
      parentURL: `${appBaseUrl}/library/JSDB/DataProxy.js`,
      resolvesTo: defaultResolve
    },

    // A regular module imported from a component using a relative app in the app/site.
    {
      specifier: '../../library/Constants',
      parentUrl: `${appBaseUrl}/admin/setup/PSL.component?16480312652440.27355496040074123`,
      resolvesTo: defaultResolve
    }
  ]

  // Set the context so that the resolve function thinks it’s being run from the requested NodeKit app path.
  const nodekitAppPath = nodeKitBaseUrl.replace('file://', '')
  const svelteModulePath = path.join(nodekitAppPath, 'node_modules', 'svelte')
  const svelteExports = (await import(`${nodekitAppPath}/node_modules/svelte/package.json`, {assert: {type: 'json'}})).default.exports

  context.svelteModulePath = svelteModulePath
  context.svelteExports = svelteExports

  t.plan(resolutions.length)

  for (const resolution of resolutions) {
    let defaultResolveFunction
    if (resolution.resolvesTo === defaultResolve) {
      defaultResolveFunction = () => {
        t.pass(`defaultResolve called as expected for specifier ${resolution.specifier}`)
      }
    } else {
      defaultResolveFunction = () => {
        t.fail(`defaultResolve unexpectedly called for specifier ${resolution.specifier}`)
      }
    }
    const resolved = await resolve(
      resolution.specifier,
      { 
        parentURL: resolution.parentURL,
        conditions
      }, // (context)
      defaultResolveFunction
    )

    if (resolution.resolvesTo !== defaultResolve) {
      t.ok(resolved.url.startsWith(resolution.resolvesTo), `Custom resolution as expected for specifier ${resolution.specifier}`)
    }
  }
})

test('load', async t => {
  const defaultLoad = 'default load'
  const javaScriptLoad = 'javascript load'
  const svelteLoad = 'svelte load'
  
  // Expectations.
  const expectations = [
    // Add some manual expectations of URLs from actual projects.
    {
      url: `file://${homeDirectory}/Projects/small-web/nodekit/app/bin/nodekit.js`,
      expectLoadType: defaultLoad
    },
    {
      url: `file://${homeDirectory}/Projects/small-web/domain/admin/setup/Index.component?16481489621020.8945935403486827`,
      expectLoadType: svelteLoad
    },
    {
      url: `file://${homeDirectory}/Projects/small-web/domain/library/TabbedInterface/TabbedInterface.svelte?16481489621070.7993410753465431`,
      expectLoadType: svelteLoad
    },
    {
      url: `file://${homeDirectory}/Projects/small-web/nodekit/app-main/examples/simple-chat/chat.socket?16481493446160.5662604717606914`,
      expectLoadType: javaScriptLoad
    }
  ]

  // And then, for completeness, ensure that we’re checking all the extensions.
  const _svelteAliases = [
    '.page',
    '.data',
    '.component',
    '.svelte'
  ]
  
  const _javaScriptAliases = [
    '.get',
    '.head',
    '.patch',
    '.options',
    '.connect',
    '.delete',
    '.trace',
    '.post',
    '.put',
    '.socket'
  ]

  const fictitiousProjectBaseUrl = `file://${homeDirectory}/Projects/fictitious-project/src`

  for (const svelteAlias of _svelteAliases) {
    expectations.push({
      url: `${fictitiousProjectBaseUrl}/fictitious${svelteAlias}`,
      expectLoadType: svelteLoad
    })
  }

  for (const javaScriptAlias of _javaScriptAliases) {
    expectations.push({
      url: `${fictitiousProjectBaseUrl}/fictituous${javaScriptAlias}`,
      expectLoadType: javaScriptLoad
    })
  }

  const numberOfExpectations = expectations.length

  t.plan(numberOfExpectations)

  let defaultLoadFunction

  for await (const expectation of expectations) {
    // Mock the various functions in the ES Module Loader’s load function context
    // depending on which we expect to get called for the current load url. 
    switch (expectation.expectLoadType) {
      case defaultLoad:
        defaultLoadFunction = async () => t.pass(`Default load triggered as expected for ${expectation.url}`)
        context.compileSource = async () => t.fail(`Svelte alias load triggered when default load was expected for ${expectation.url}`)
        context.fsPromises = {
          readFile: async () => t.fail(`JavaScript alias laod triggered when default load was expected for ${expectation.url}`)
        }
      break

      case svelteLoad:
        defaultLoadFunction = async () => t.fail(`Default load called when Svelte alias load was expected for ${expectation.url}`)
        context.compileSource = async () => t.pass(`Svelte alias load triggered as expected for ${expectation.url}`)
        context.fsPromises = {
          readFile: async () => t.fail(`JavaScript alias load triggered when Svetle alias load was expected for ${expectation.url}`)
        }
      break

      case javaScriptLoad:
        defaultLoadFunction = async () => t.fail(`Default load called when JavaScript alias load was expected for ${expectation.url}`)
        context.compileSource = async () => t.fail(`Svelte alias load was triggered when JavaScript alias load was expected for ${expectation.url}`)
        context.fsPromises = {
          readFile: async () => t.pass(`JavaScript alias load was triggered as expected for ${expectation.url}`)
        }
      break
    }

    await load(expectation.url, { format: undefined }, defaultLoadFunction)
  }
})
