console.verbose = process.env.VERBOSE ? function () { console.log(...arguments) } : () => {}
console.profileTime = process.env.PROFILE ? function () { console.time(...arguments) } : () => {}
console.profileTimeEnd = process.env.PROFILE ? function () { console.timeEnd(...arguments) } : () => {}

console.verbose('================== LOADER PROCESS START =====================')

// console.time('Loader initialisation')

import path from 'path'
import fsPromises from 'fs/promises'
import { compile } from 'svelte/compiler'
import { hydrationScriptCompiler } from './lib/HydrationScriptCompiler.js'
import { loaderPaths, routeFromFilePath } from './lib/Utils.js'

import { BroadcastChannel } from 'worker_threads'
import { fileURLToPath } from 'url'

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

const scriptRegExp = /\<script\>.*?\<\/script\>/s
const nodeScriptRegExp = /\<data\>(.*?)\<\/data\>/s
const styleRegExp = /\<style\>.*?\<\/style\>/s

// Capture everything after the last dot as a named group called extension.
const fileUrlExtensionRegExp = /^.+(?<extension>\..*$)/

// This is the broadcast channel our loader worker uses to
// talk to the main thread.
const broadcastChannel = new BroadcastChannel('loader-and-main-process')

function extensionOf(_urlString) {
  // Remove query string, if any.
  const urlString = _urlString.replace(/\?.*$/, '')

  const result = urlString.match(fileUrlExtensionRegExp)
  return result ? result.groups.extension : null
}

export async function resolve(_specifier, context, defaultResolve) {
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

  const isSvelteImport = specifier === 'svelte'
  const isImportWithSveltePrefix = specifier.startsWith('svelte/')
  const isRelativeInternalSvelteImport = context.parentURL != undefined && context.parentURL.includes('/node_modules/svelte/')

  let svelteImportPath = null
  switch (true) {
    case isSvelteImport:
      svelteImportPath = path.resolve(svelteModulePath, svelteExports['.'].node.import)
      break

    case isImportWithSveltePrefix:
      const svelteExport = specifier.replace('svelte', '.')
      const pathToExport = svelteExports[svelteExport]

      if (pathToExport === undefined) {
        console.error('[LOADER] Could not resolve Svelte export', svelteExport)
        process.exit(1)
      }
      svelteImportPath = path.resolve(svelteModulePath, pathToExport.import)
      break

    case isRelativeInternalSvelteImport:
      svelteImportPath = path.resolve(svelteModulePath, specifier.replace('..', '.'))
      break
  }
  if (svelteImportPath !== null) {
    return { url: `file://${svelteImportPath}` }  
  }

  // Handle NodeKit assets.
  const specifierExtension = path.extname(specifier)
  if (allAliases[specifierExtension]) {
    const parentURL = new URL(context.parentURL)
    const parentPath = path.dirname(parentURL.pathname)
    const absolutePath = path.resolve(parentPath, specifier)

    const resolved = { url: `file://${absolutePath}?` + Date.now() + Math.random() }

    ////////////////////////////////////////////////////////////////////////////
    // Update dependency map (Test)
    ////////////////////////////////////////////////////////////////////////////
    if (
      !context.parentURL.includes('/nodekit/app/') 
      && !context.parentURL.includes('/node_modules/')
      && specifier.startsWith('.')
    ) {
      if (!dependencyMap.has(absolutePath)) {
        dependencyMap.set(absolutePath, new Set())
      }

      /** @type Set */
      const dependency = dependencyMap.get(absolutePath)
      dependency.add(parentPath)
      
      console.verbose('Dependency map', dependencyMap)
    }
    ////////////////////////////////////////////////////////////////////////////


    // console.log('[LOADER]', 'Loading:', specifier, `(NodeKit asset: ${resolved.url.replace('file://', '') === specifier ? 'OK': `NOT ok: ${resolved.url}`})`)

    return resolved
  }


  // Update dependency map for everything else.
  if (context.parentURL !== undefined) {
    if (
      !context.parentURL.includes('/nodekit/app/') 
      && !context.parentURL.includes('/node_modules/')
      && specifier.startsWith('.')
    ) {
      console.verbose('[LOADER] Resolving', specifier, context)

      const absolutePathOfDependency = path.resolve(specifier)
      if (!dependencyMap.has(absolutePathOfDependency)) {
        dependencyMap.set(absolutePathOfDependency, new Set())
      }

      /** @type Set */
      const dependency = dependencyMap.get(absolutePathOfDependency)
      dependency.add(context.parentURL)
      
      console.verbose('Dependency map', dependencyMap)
    }  
  }


  // For anything else, let Node do its own magic.
  let resolved
  try {
    resolved = defaultResolve(specifier, context, defaultResolve)
  } catch (error) {
    console.error('[LOADER] ERROR: Could not resolve', specifier, context)
    console.trace()
    process.exit(1)
  }

  // console.log('[LOADER]', 'Loading:', specifier.includes('.small-tech.org/nodekit/app/nodekit-bundle.js') ? 'NodeKit [main process]' : specifier, `(default resolve: ${resolved.url})`)

  return resolved
}

// Node version 16.x: in 14.x, this call was split between three separate hooks, two of
// which we were using (getFormat and getSource), which are now deprecated.
// (See https://nodejs.org/docs/latest-v16.x/api/esm.html#loaders)
//
// Note: .component is just a (semantically more accurate, given our use case) alias
// ===== for .svelte and is treated in exactly the same way. On the other hand,
//       .page and .layout are supersets of Svelte and can include a script block
//       with a context of 'node' that gets executed in Node before every render. The data
//       returned is injected into the page as it is being rendered. Additionally,
//       .layout files get special treatment in that they are injected into every page
//       within the same directory and any subdirectories (TODO) unless a reset.layout file
//       is present (TODO).

export async function load(url /* string */, context, defaultLoad) {
  const _url = new URL(url)

  // console.verbose(`[LOADER] Loading ${_url}`)

  if (_url.protocol === 'file:') {
    const format = 'module'
    if (svelteAliases[extensionOf(url)]) {
      // Svelte route.
      const source = await compileSource(_url.pathname)
      return { format, source }
    } else if (javaScriptAliases[extensionOf(url)]) {
      // JavaScript route.
      const source = await fsPromises.readFile(_url.pathname)
      return { format, source }
    }
  }

  return defaultLoad(url, context, defaultLoad)
}

async function compileSource(filePath) {

  const source = await fsPromises.readFile(filePath, 'utf8')
  const routeRelativePath = path.relative(__dirname, filePath)

  // TODO: Refactor – pull these out into the shared route calculation method.
  // Transform an absolute file system path to a web server route.
  const route = routeFromFilePath(filePath)

  console.verbose(`[LOADER] Compiling ${route}`)

  let svelteSource = source
  let nodeScript

  const nodeScriptResult = nodeScriptRegExp.exec(source)
  if (nodeScriptResult) {
    console.verbose('  • Route has NodeScript.')
    // Contains a Node script. Svelte knows nothing about this, so we
    // strip it out and persist it for use during server-side rendering.
    svelteSource = source.replace(nodeScriptResult[0], '')

    // Wrap the  request into the script so its available
    // to the script without making people wrap their script
    // in an async function.
    nodeScript = nodeScriptResult[1]
  }

  // Layout (TODO) and hydration script support.
  if (filePath.endsWith('.page')) {
    let script = scriptRegExp.exec(svelteSource)
    script = script ? script[0] : ''
    const markup = svelteSource.replace(scriptRegExp, '').replace(styleRegExp, '').trim()

        // TODO: Implement layout support properly based on the list of layout
        // ===== pages that have already been compiled (the commented-out code is
        //       from the hardcoded spike).
        const scriptWithLayoutImport = script
        const markupWithLayout = markup

        // const scriptWithLayoutImport = script.replace('<script>', "<script>\n  import PageLayout from './Page.layout'\n")
        // const markupWithLayout = `<PageLayout>\n${markup}\n</PageLayout>`

    svelteSource = svelteSource.replace(script, scriptWithLayoutImport).replace(markup, markupWithLayout)

    // Client-side hydration script.
    const hydrationCode = await hydrationScriptCompiler(routeRelativePath, route)
    const hydrationScript = hydrationCode

    const routeDetails = {
      route,
      contents: {
        routeRelativePath,
        nodeScript,
        hydrationScript
      }
    }

    // console.log('[LOADER] New route!', route)

    // Update the route cache with the material for this route.
    broadcastChannel.postMessage(routeDetails)
  }

  const compilerOptions = {
    generate: 'ssr',
    format: 'esm',
    hydratable: true,
  }

  const output = compile(svelteSource, compilerOptions)

  return output.js.code
}

// console.timeEnd('Loader initialisation')
