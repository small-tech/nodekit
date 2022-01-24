// Compile, link, and return (using esbuild) the
// client-side hydration script for a page.

// Adapted from:
// https://esbuild.github.io/plugins/#svelte-plugin
import path from 'path'
import fs from 'fs'
import { compile } from 'svelte/compiler'
import esbuild from 'esbuild'

const nodekitAppPath = process.argv[1].replace('nodekit-bundle.js', '')
const svelteExports = (await import(`${nodekitAppPath}/node_modules/svelte/package.json`)).default.exports

import { classNameFromRoute } from './Utils'

export async function hydrationScriptCompiler (relativePagePath, route) {
  console.log('  • Compiling hydration script for', relativePagePath)
  console.time(`  • Hydration script compiled: ${relativePagePath}`)
  let result
  try {
    result = await esbuild.build({
      entryPoints: [relativePagePath],
      // Pass the NodeKit apps own node_modules path to node paths so that
      // projects don’t have to install Svelte themselves (so we can be sure
      // only one version is used and to simplify authoring). Unlike Node.js
      // itself, esbuild knows how to handle node paths. For Node, we implement
      // the same thing by overriding module resolution in the loader.
      // nodePaths: [path.join(process.cwd(), 'node_modules')],
      bundle: true,
      format: 'esm',
      // Do not write out, we will consume the generated source from here.
      write: false,
      plugins: [
        {
          name: 'Resolve Svelte routes',
          setup(build) {
            // Ensure we only ever use the version of Svelte that comes bundled
            // with NodeKit. This is also what we do in the ES Module Loader.
            // TODO: Refactor to remove redundancy (both between the various rules and
            // between here and the SSR module resolution in loader.js.)
            build.onResolve({filter: /^svelte$/}, args => {
              const importPath = path.resolve(path.join(nodekitAppPath, 'node_modules', 'svelte'), svelteExports['.'].browser.import)
              const resolved = { path: importPath }
              console.log('[HYDRATION SCRIPT COMPILER]', 'Loading:', args.path, `Main svelte package from NodeKit (${resolved.path})`)
              return resolved
            })

            build.onResolve({filter: /^svelte\//}, args => {
              const svelteExport = args.path.replace('svelte', '.')
              const pathToExport = svelteExports[svelteExport]

              if (pathToExport === undefined) {
                console.error('[HYDRATION SCRIPT COMPILER] Could not resolve Svelte export', svelteExport)
                process.exit(1)
              }
              const importPath = path.resolve(path.join(nodekitAppPath, 'node_modules', 'svelte'), pathToExport.import)

              const resolved = { path: importPath }

              console.log('[HYDRATION SCRIPT COMPILER]', 'Loading:', args.path, `(Svelte sub-package; serving from NodeKit: ${resolved.path})`)

              return resolved
            })

            build.onResolve({filter: /.*/}, args => {
              console.log('[HYDRATION SCRIPT COMPILER] onResolve', args)

              if (args.importer.includes('/node_modules/svelte/')) {
                const importPath = path.resolve(path.join(nodekitAppPath, 'node_modules', 'svelte'), args.path.replace('..', '.'))
                const resolved = { path: importPath }
                console.log('[HYDRATION SCRIPT COMPILER]', 'Loading:', args.path, `Svelte internal relative package reference (${resolved.path})`)
                return resolved
              } else {
                return
              }
            })

            build.onLoad({filter: /.*/}, args => {
              // For logging purposes only during early dev.
              console.log('[HYDRATION SCRIPT COMPILER] onLoad', args)
              return
            })
          }
        },
        sveltePlugin(route),
        {
          name: 'Build lifecycle',
          setup(build) {
            build.onStart(() => {
              console.log('[HYDRATION SCRIPT COMPILER] ========= Build Started =========')
            })

            build.onEnd(result => {
              console.log('[HYDRATION SCRIPT COMPILER] ========= Build Ended =========')
            })
          }
        }
      ],
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

          console.log('[HYDRATION SCRIPT COMPILER] Compiling Svelte:', filename)

          const compilerOptions = {
            filename,
            hydratable: true,
            // CSS is injected into the template. We don’t want to duplicate it in the
            // hydration script.
            css: !args.path.endsWith('.page')
          }
          if (args.path.endsWith('.page')) {
            // This is what the class will be named in the page. By hardcoding it,
            // we can write the code in the page wrapper to initialise it.
            compilerOptions.name = classNameFromRoute(route)
            console.log('[HydrationScriptCompiler] Setting class name for page', compilerOptions.name)
          }
          let { js, warnings } = compile(source, compilerOptions)
          let contents = js.code + `//# sourceMappingURL=` + js.map.toUrl()

          return { contents, warnings: warnings.map(convertMessage) }
        } catch (e) {
          return { errors: [convertMessage(e)] }
        }
      })
    }
  }
}
