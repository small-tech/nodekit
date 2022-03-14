// esbuild plugin – compiles Svelte

import path from 'path'
import fs from 'fs'
import { compile } from 'svelte/compiler'

import { classNameFromRoute } from '../../Utils'

export function sveltePlugin (route) {
  console.verbose('[SveltePlugin] Building route', route)
  return {
    name: 'NodeScript',
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

        const { normalisedSource } = parseSource(source)

        try {
          console.verbose('[HYDRATION SCRIPT COMPILER] Compiling Svelte:', filename)

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
          }
          let { js, warnings } = compile(normalisedSource, compilerOptions)
          let contents = js.code + `//# sourceMappingURL=` + js.map.toUrl()

          return { contents, warnings: warnings.map(convertMessage) }
        } catch (e) {
          return { errors: [convertMessage(e)] }
        }
      })
    }
  }
}
