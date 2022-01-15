console.time('Loader initialisation')
console.log('================== LOADER PROCESS START =====================')
import path from 'path'
import fs from 'fs'
import { compile } from 'svelte/compiler'
import { hydrationScriptCompiler } from './lib/HydrationScriptCompiler.js'

import { BroadcastChannel } from 'worker_threads'

import JSDB from '@small-tech/jsdb'

import { fileURLToPath } from 'url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))

// TODO: We should store the cache in the NodeKit settings directory.
// ===== I don’t want to pollute the project folder unless we absolutely have to.
let db = null

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

const _allAliases = _svelteAliases.concat(_javaScriptAliases)

const svelteAliases = truthyHashmapFromArray(_svelteAliases)
const javaScriptAliases = truthyHashmapFromArray(_javaScriptAliases)
const allAliases = truthyHashmapFromArray(_allAliases)

const scriptRegExp = /\<script\>.*?\<\/script\>/s
const nodeScriptRegExp = /\<data\>(.*?)\<\/data\>/s
const styleRegExp = /\<style\>.*?\<\/style\>/s

const fileUrlExtensionRegExp = /.+?(?<extension>\..*?$)/

const broadcastChannel = new BroadcastChannel('loader-and-main-process')

function extensionOf(urlString) {
  const result = urlString.match(fileUrlExtensionRegExp)
  return result ? result.groups.extension : null
}

// // This will hold the BroadcastChannel used to communicate with the main process.
// let mainProcessMessagePort = null

// export function globalPreload ({port}) {
//   console.log('[Loader] Main process message port', port)
//   mainProcessMessagePort = port

//   setTimeout(() => {
//     port.postMessage('Hello from the loader! :))')
//   }, 3000)

//   return `\
//   port.onmessage = (evt) => {
//     console.log('[Main process] Received data from loader process', evt.data);
//   };
// `;
// }


export async function resolve(specifier, context, defaultResolve) {

  broadcastChannel.postMessage(`Resolving ${specifier}`)

  if (allAliases[path.extname(specifier)]) {
    const parentURL = new URL(context.parentURL)
    const parentPath = path.dirname(parentURL.pathname)
    const absolutePath = path.resolve(parentPath, specifier)

    return {
      url: `file://${absolutePath}`
    }
  }

  return defaultResolve(specifier, context, defaultResolve)
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

  // console.log(`[LOADER] Loading ${_url}`)

  if (_url.protocol === 'file:') {
    const format = 'module'
    if (svelteAliases[extensionOf(url)]) {
      // Svelte route.
      const source = await compileSource(_url.pathname)
      return { format, source }
    } else if (javaScriptAliases[extensionOf(url)]) {
      // JavaScript route.
      const source = fs.readFileSync(_url.pathname)
      return { format, source }
    }
  }

  return defaultLoad(url, context, defaultLoad)
}

// TODO: Refactor – pull these out into the shared route calculation method.
const HTTP_METHODS = ['get', 'head', 'patch', 'options', 'connect', 'delete', 'trace', 'post', 'put']
const supportedExtensions = `\.(page|socket|${HTTP_METHODS.join('|')})$`
const indexWithExtensionRegExp = new RegExp(`index${supportedExtensions}`)
const extensionRegExp = new RegExp(supportedExtensions)

async function compileSource(filePath) {

  console.log(`[LOADER] Compiling ${filePath}`)

  const source = fs.readFileSync(filePath, 'utf8')

  const basePath = process.env.basePath
  console.log('[[[[[[[[Loader BASEPATH from env]]]]]]]]]]]]', basePath)

  // Ensure database exists, has the routes table, and is open.
  if (db === null) {
    db = JSDB.open(path.join(basePath, '.cache'))
    if (!db.routes) {
      db.routes = {}
    }
  }

  const routeRelativePath = path.relative(__dirname, filePath)

// TODO: Refactor – pull these out into the shared route calculation method.
  // Transform an absolute file system path to a web server route.
  const route = filePath
    .replace(basePath, '')             // Remove the base path.
    .replace(/_/g, '/')                     // Replace underscores with slashes.
    .replace(/\[(.*?)\]/g, ':$1')           // Replace properties. e.g., [prop] becomes :prop
    .replace(indexWithExtensionRegExp, '')  // Remove index path fragments (and their extensions)
    .replace(extensionRegExp, '')           // Remove extension.

  let svelteSource = source
  let nodeScript

  const nodeScriptResult = nodeScriptRegExp.exec(source)
  if (nodeScriptResult) {
    console.log('> Has NodeScript.')
    // Contains a Node script. Svelte knows nothing about this, so we
    // strip it out and persist it for use during server-side rendering.
    svelteSource = source.replace(nodeScriptResult[0], '')

    // Wrap the  request into the script so its available
    // to the script without making people wrap their script
    // in an async function.
    nodeScript = nodeScriptResult[1]
  }

  console.log('File path', filePath)
  console.log('Route', route)
  console.log('Route relative path', routeRelativePath)
  // console.log('NodeScript:', nodeScript)
  // console.log('Svelte source', svelteSource)

  // Layout (TODO) and hydration script support.
  if (filePath.endsWith('.page')) {
    const script = scriptRegExp.exec(svelteSource)[0]
    const markup = svelteSource.replace(scriptRegExp, '').replace(styleRegExp, '').trim()

        // TODO: Implement layout support properly based on the list of layout
        // ===== pages that have already been compiled (the commented-out code is
        //       from the hardcoded spike).
        const scriptWithLayoutImport = script
        const markupWithLayout = markup

        // const scriptWithLayoutImport = script.replace('<script>', "<script>\n  import PageLayout from './Page.layout'\n")
        // const markupWithLayout = `<PageLayout>\n${markup}\n</PageLayout>`

    svelteSource = svelteSource.replace(script, scriptWithLayoutImport).replace(markup, markupWithLayout)

    // console.log('>>> svelteSource', svelteSource)

    // Client-side hydration script.
    const hydrationCode = await hydrationScriptCompiler(routeRelativePath)
    const hydrationScript = hydrationCode

    // Update the route cache with the material for this route.
    db.routes[route] = {
      nodeScript,
      hydrationScript
    }
  }

  const output = compile(svelteSource, {
    generate: 'ssr',
    format: 'esm',
    hydratable: true
  })

  return output.js.code
}

console.timeEnd('Loader initialisation')
