console.verbose = process.env.VERBOSE ? function () { console.log(...arguments) } : () => {}
console.profileTime = process.env.PROFILE ? function () { console.time(...arguments) } : () => {}
console.profileTimeEnd = process.env.PROFILE ? function () { console.timeEnd(...arguments) } : () => {}

import path from 'path'
import fsPromises from 'fs/promises'
import { fileURLToPath } from 'url'
import { compile } from 'svelte/compiler'

import { createHydrationScriptBundle } from '../esbuild/HydrationScriptBundler.js'
import { loaderPaths, routeFromFilePath, parseSource } from '../Utils.js'
import LoaderAndMainProcessBroadcastChannel from '../LoaderAndMainProcessBroadcastChannel.js'

const { nodekitAppPath, svelteExports } = await loaderPaths()

const svelteModulePath = path.join(nodekitAppPath, 'node_modules', 'svelte')

const __dirname = fileURLToPath(new URL('.', import.meta.url))

function truthyHashmapFromArray(array) {
  return array.reduce((obj, key) => { obj[key] = true; return obj}, {})
}

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

const dependencyMap = new Map()

const _allAliases = _svelteAliases.concat(_javaScriptAliases)

const svelteAliases = truthyHashmapFromArray(_svelteAliases)
const javaScriptAliases = truthyHashmapFromArray(_javaScriptAliases)
const allAliases = truthyHashmapFromArray(_allAliases)

// Capture everything after the last dot as a named group called extension.
const fileUrlExtensionRegExp = /^.+(?<extension>\..*$)/

// This is the broadcast channel our loader worker uses to
// talk to the main thread.
//
// Note that the existence of this will block the main process from exiting
// so if you want the app to exit at any time, you must manually call the
// process.exit() method.
const broadcastChannel = new LoaderAndMainProcessBroadcastChannel()

function extensionOf(_urlString) {
  // Remove query string, if any.
  const urlString = _urlString.replace(/\?.*$/, '')

  const result = urlString.match(fileUrlExtensionRegExp)
  return result ? result.groups.extension : null
}

// Return a resolved object from a path.
function resolvedFromPath(importPath) {
  return { url: `file://${importPath}` }
}

export const context = {
  svelteExports,
  svelteModulePath,
  compileSource,
  fsPromises,
  __dirname
}

export const resolve = (async function (_specifier, context, defaultResolve) {
  // Since we don’t want every NodeKit project to have to npm install Svelte
  // to work, we resolve Svelte URLs to the version of Svelte that we’ve
  // installed with NodeKit. This also ensures that both the hydration
  // script run by esbuild in the loader and the Svelte SSR compiler in the
  // main worker use the same version of Svelte so we don’t run into any
  // versioning issues either.
  //
  // We get the import paths from the exports object defined in Svelte’s
  // package file (svelteExports).

  // Remove query string (testing, for now.)
  const specifier = _specifier.replace(/\?.*$/, '')
  const specifierExtension = path.extname(specifier)

  let parent = {}
  if (context.parentURL) {
    parent.url = new URL(context.parentURL)
    parent.path = path.dirname(parent.url.pathname)
    parent.absolutePath = path.resolve(parent.path, specifier)
  }

  const isSvelteImport = specifier === 'svelte'
  const isImportWithSveltePrefix = specifier.startsWith('svelte/')
  const isRelativeInternalSvelteImport = context.parentURL != undefined && context.parentURL.includes('/node_modules/svelte/')
  const isNodeKitAsset = allAliases[specifierExtension]

  let resolved = null

  switch (true) {
    case isSvelteImport:
      resolved = resolvedFromPath(path.resolve(this.svelteModulePath, this.svelteExports['.'].node.import))
      break

    case isImportWithSveltePrefix:
      const svelteExport = specifier.replace('svelte', '.')
      const pathToExport = this.svelteExports[svelteExport]

      if (pathToExport === undefined) {
        console.error('[LOADER] Could not resolve Svelte export', svelteExport)
        process.exit(1)
      }
      resolved = resolvedFromPath(path.resolve(this.svelteModulePath, pathToExport.import))
      break

    case isRelativeInternalSvelteImport:
      resolved = resolvedFromPath(path.resolve(this.svelteModulePath, specifier.replace('..', '.')))
      break

    case isNodeKitAsset:
      // Add a unique cache-busting query string so we can live reload during development.
      const cacheBusterDuringDevelopment = process.env.PRODUCTION ? '' : `?${Date.now()}${Math.random()}`
      resolved = resolvedFromPath(`${parent.absolutePath}${cacheBusterDuringDevelopment}`)
      break

    default:
      // For anything else, let Node do its own magic.
      try {
        resolved = defaultResolve(specifier, context, defaultResolve)
      } catch (error) {
        // The default resolver has failed. We cannot recover from this. Panic!
        console.error('[LOADER] ERROR: Could not resolve', specifier, context)
        console.trace()
        process.exit(1)
      }
  }

  if (!process.env.PRODUCTION) {
    // Update dependency map
    if (
      context.parentURL && 
      // We use /nodekit/app/ to check for NodeKit itself but we want to exclude
      // the examples directory itself from this check as well as any root
      // page in the project being served (that’s loaded by /nodekit/app/index.js )
      (!context.parentURL.includes('/nodekit/app/') 
      || (specifier.endsWith('.page') && context.parentURL.endsWith('/nodekit/app/index.js'))
      || context.parentURL.includes('/nodekit/app/examples/')
      )
      && !context.parentURL.includes('/node_modules/')
      && (specifier.startsWith('.') || specifier.startsWith('/'))
    ) {
      const specifierAbsolutePath = path.resolve(parent.path, specifier)
      if (!dependencyMap.has(specifierAbsolutePath)) {
        dependencyMap.set(specifierAbsolutePath, new Set())
      }

      /** @type Set */
      const dependency = dependencyMap.get(specifierAbsolutePath)
      dependency.add(context.parentURL.replace('file://', '').replace(/\?.*$/, ''))
      
      // For now fire a dependencyMap update on every route.
      // This may be overwhelming. Reconsider once it’s working.
      broadcastChannel.postMessage({
        type: 'dependencyMap',
        dependencyMap
      }) 
    }
  }

  return resolved
}).bind(context)

// Node version 16.x: in 14.x, this call was split between three separate hooks, two of
// which we were using (getFormat and getSource), which are now deprecated.
// (See https://nodejs.org/docs/latest-v16.x/api/esm.html#loaders)
//
// Note: .component is just a (semantically more accurate, given our use case) alias
// ===== for .svelte and is treated in exactly the same way. On the other hand,
//       .page and .layout (TODO) are supersets of Svelte and can include a script block
//       with a context of 'node' that gets executed in Node before every render. The data
//       returned is injected into the page as it is being rendered. Additionally,
//       .layout files get special treatment in that they are injected into every page
//       within the same directory and any subdirectories (TODO) unless a reset.layout file
//       is present (TODO).

export const load = (async function (url /* string */, context, defaultLoad) {
  const _url = new URL(url)
  const isFileProtocol = _url.protocol === 'file:'
  const isSvelteRoute = svelteAliases[extensionOf(url)]
  const isJavaScriptRoute = javaScriptAliases[extensionOf(url)]
  
  let result
  switch (true) {
    case isFileProtocol && isSvelteRoute:
      result = { format: 'module', source: await this.compileSource(_url.pathname) }
      break

    case isFileProtocol && isJavaScriptRoute:
      result = { format: 'module', source: await this.fsPromises.readFile(_url.pathname) }
      break

    default:
      result = await defaultLoad(url, context, defaultLoad)
  }

  return result
}).bind(context)

// Compiles Svelte-related sources (including .pages, etc.)
async function compileSource(filePath) {
  const source = await fsPromises.readFile(filePath, 'utf8')
  const routeRelativePath = path.relative(this.__dirname, filePath)

  // Transform an absolute file system path to a web server route.
  const route = routeFromFilePath(filePath)

  console.verbose(`[LOADER] Compiling ${route}`)

  const { normalisedSource, nodeScript } = parseSource(source)

  // Hydration script support.
  let routeDetails = null
  if (filePath.endsWith('.page')) {
    // Compile client-side hydration script.
    const hydrationScript = await createHydrationScriptBundle(routeRelativePath, route)

    routeDetails = {
      route,
      contents: {
        routeRelativePath,
        nodeScript,
        hydrationScript 
      }
    }
  }

  const compilerOptions = {
    generate: 'ssr',
    format: 'esm',  // (This is the default.)
    // css: false,  // This has no effect. Don’t use. See https://github.com/sveltejs/svelte/issues/3604
    enableSourcemap: false,
    hydratable: true,
  }

  if (!process.env.PRODUCTION) {
    compilerOptions.dev = true
  }

  const output = compile(normalisedSource, compilerOptions)

  if (!process.env.PRODUCTION) {
    if (routeDetails !== null) {
      // Remove the generated CSS code so we can check if JS has changed
      // between builds or not.
      routeDetails.contents.js = output.js.code
                                    .replace(/const css = \{.*?};/s, '')
                                    .replace('$$result.css.add(css);', '')
                                    .replace(/svelte-.*?"\}/g, '')
      routeDetails.contents.css = output.css.code
      routeDetails.dependencyMap = dependencyMap
    }
  }

  // Update the route cache with the material for this route.
  if (routeDetails !== null) {
    broadcastChannel.postMessage(routeDetails)
  }

  return output.js.code
}
