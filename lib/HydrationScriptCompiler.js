// Compile, link, and return (using esbuild) the
// client-side hydration script for a page.

// Adapted from:
// https://esbuild.github.io/plugins/#svelte-plugin
import path from 'path'
import fs from 'fs'
import { compile } from 'svelte/compiler'
import esbuild from 'esbuild'

import { classNameFromRoute } from './Utils'

export async function hydrationScriptCompiler (relativePagePath, route) {
  console.log('  • Compiling hydration script for', relativePagePath)
  console.time(`  • Hydration script compiled: ${relativePagePath}`)
  let result
  try {
    result = await esbuild.build({
      entryPoints: [relativePagePath],
      bundle: true,
      format: 'esm',
      // Do not write out, we will consume the generated source from here.
      write: false,
      plugins: [sveltePlugin(route)],
    })
  } catch (error) {
    console.error('esbuild error', error)
    process.exit(1)
  }

  const code = new TextDecoder().decode(result.outputFiles[0].contents)
  console.timeEnd(`  • Hydration script compiled: ${relativePagePath}`)

  // console.log('HYDRATION CODE:', code)

  return code
}

// Private

const scriptRegExp = /\<script\>.*?\<\/script\>/s
const nodeScriptRegExp = /\<data\>(.*?)\<\/data\>/s
const styleRegExp = /\<style\>.*?\<\/style\>/s

const sveltePlugin = function (route) {
  console.log('[HYDRATION SCRIPT COMPILER] Svelte plugin running for route', route)
  return {
    name: 'svelte',
    setup(build) {
      build.onLoad({ filter: /(\.svelte|\.component|\.page|\.layout)$/ }, async (args) => {
        // This converts a message in Svelte's format to esbuild's format
        let convertMessage = ({ message, start, end }) => {
          console.log('message', message)
          let location
          if (start && end) {
            let lineText = source.split(/\r\n|\r|\n/g)[start.line - 1]
            let lineEnd = start.line === end.line ? end.column : lineText.length
            location = {
              file: filename,
              line: start.line,
              column: start.column,
              length: lineEnd - start.column,
              lineText,
            }
          }
          return { text: message, location }
        }

        // Load the file from the file system
        let source = await fs.promises.readFile(args.path, 'utf8')
        let filename = path.relative(process.cwd(), args.path)

        let nodeSource
        const nodeScriptResult = nodeScriptRegExp.exec(source)
        if (nodeScriptResult) {
          // Contains a Node script. Svelte knows nothing about this, so we
          // strip it out and persist it for use during server-side rendering.
          source = source.replace(nodeScriptResult[0], '')
        }

        // TODO: Implement layouts.
        // if (args.path.endsWith('.page')) {
        //   const script = scriptRegExp.exec(source)[0]
        //   console.log('[HYDRATION] script', script)
        //   const markup = source.replace(scriptRegExp, '').replace(styleRegExp, '').trim()

        //   // TODO: Implement layout support properly based on the list of layout
        //   // ===== pages that have already been compiled (the commented-out code is
        //   //       from the hardcoded spike).
        //   const scriptWithLayoutImport = script
        //   const markupWithLayout = markup

        //   // const scriptWithLayoutImport = script.replace('<script>', "<script>\n  import PageLayout from './Page.layout'\n")
        //   // const markupWithLayout = `<PageLayout>\n${markup}\n</PageLayout>`

        //   source = source.replace(script, scriptWithLayoutImport).replace(markup, markupWithLayout)
        // }

        // console.log('[HYDRATION SCRIPT]', filename, source)

        // Convert Svelte syntax to JavaScript
        try {
          const compilerOptions = {
            filename,
            hydratable: true,
            // CSS is injected into the template. We don’t want to duplicate it in the
            // hydration script.
            css: false
          }
          if (args.path.endsWith('.page')) {
            // This is what the class will be named in the page. By hardcoding it,
            // we can write the code in the page wrapper to initialise it.
            compilerOptions.name = classNameFromRoute(route)
            console.log('[HydrationScriptCompiler] Setting class name for page', compilerOptions.name)
          }
          let { js, warnings } = compile(source, compilerOptions)
          let contents = js.code + `//# sourceMappingURL=` + js.map.toUrl()

          // TODO: Suppressing warnings for now. Remove this once it all compiles.
          return { contents, warnings: [] /* warnings.map(convertMessage) */}
        } catch (e) {
          return { errors: [convertMessage(e)] }
        }
      })
    }
  }
}
