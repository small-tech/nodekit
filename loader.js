console.time('Loader initialisation')
console.log('================== LOADER PROCESS START =====================')
import path from 'path'
import fs from 'fs'
import { compile } from 'svelte/compiler'
import { hydrationScriptCompiler } from './lib/HydrationScriptCompiler.js'

import JSDB from '@small-tech/jsdb'

import { fileURLToPath } from 'url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))

// TODO: We should store the cache in the NodeKit settings directory.
// ===== I don’t want to pollute the project folder unless we absolutely have to.
const db = JSDB.open('.cache')
if (!db.routes) {
  db.routes = {}
}

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

function extensionOf(urlString) {
  const result = urlString.match(fileUrlExtensionRegExp)
  return result ? result.groups.extension : null
}

export async function resolve(specifier, context, defaultResolve) {

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


async function compileSource(filePath) {
  const source = fs.readFileSync(filePath, 'utf8')

  const route = path.relative(__dirname, filePath)

  let svelteSource = source
  let nodeScript

  const nodeScriptResult = nodeScriptRegExp.exec(source)
  if (nodeScriptResult) {
    // Contains a Node script. Svelte knows nothing about this, so we
    // strip it out and persist it for use during server-side rendering.
    svelteSource = source.replace(nodeScriptResult[0], '')

    // Wrap the  request into the script so its available
    // to the script without making people wrap their script
    // in an async function.
    nodeScript = `export default async request => {\n${nodeScriptResult[1]}\n}`
  }

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

    // Client-side hydration script.
    const hydrationCode = await hydrationScriptCompiler(route)
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
