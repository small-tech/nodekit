import os from 'os'
import path from 'path'

import { test } from './helpers'

import { context, resolve } from '../lib/processes/loader'

// The context conditions passed during resolution.
const conditions = [ 'node', 'import', 'node-addons' ]

// Paths/URLs used in the tests.
// Gathered from a run of Domain (https://github.com/small-tech/domain).
const nodeKitBaseUrl = 'file:///home/aral/.small-tech.org/nodekit/app'
const appBaseUrl = 'file:///home/aral/Projects/small-web/domain'
const nodeKitBundleUrl = `${nodeKitBaseUrl}/nodekit-bundle.js`
const adminIndexPagePath = '/home/aral/Projects/small-web/domain/admin/index.page'
const adminIndexPageFileUrlWithCacheBusterQueryString = `file://${adminIndexPagePath}?16480312632870.029349449465893684`
const placesComponentFileUrl = `${appBaseUrl}/admin/places/Index.component?16480312651970.2189263663664751`
const domainCheckerComponentFileUrl = `${appBaseUrl}/library/DomainChecker.svelte`
const paymentBaseFileUrl = 'file:///home/aral/Projects/small-web/domain/admin/setup/payment'

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
const svelteExports = (await import(`${nodekitAppPath}/node_modules/svelte/package.json`)).default.exports

context.svelteModulePath = svelteModulePath
context.svelteExports = svelteExports


test('resolve', async t => {
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
      t.ok(resolved.url.startsWith(resolution.resolvesTo), `Custom resolutoin as expected for specifier ${resolution.specifier}`)
    }
  }
})
