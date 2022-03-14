// esbuild plugin
//
// Ensures we only ever use the version of Svelte that comes bundled
// with NodeKit. This is also what we do in the ES Module Loader.
// TODO: Refactor to remove redundancy (both between the various rules and
// between here and the SSR module resolution in loader.js.)

import path from 'path'
import { loaderPaths } from '../../Utils.js'
const { nodekitAppPath, svelteExports } = await loaderPaths()

export default {
  name: 'Resolve Svelte routes',
  setup(build) {
    build.onResolve({filter: /^svelte$/}, args => {
      const importPath = path.resolve(path.join(nodekitAppPath, 'node_modules', 'svelte'), svelteExports['.'].browser.import)
      const resolved = { path: importPath }
      return resolved
    })

    build.onResolve({filter: /^svelte\//}, args => {
      const svelteExport = args.path.replace('svelte', '.')
      const pathToExport = svelteExports[svelteExport]

      if (pathToExport === undefined) {
        console.error('[ResolveSvelteRoutesPlugin] Could not resolve Svelte export', svelteExport)
        process.exit(1)
      }
      const importPath = path.resolve(path.join(nodekitAppPath, 'node_modules', 'svelte'), pathToExport.import)
      const resolved = { path: importPath }
      return resolved
    })

    build.onResolve({filter: /.*/}, args => {
      if (args.importer.includes('/node_modules/svelte/')) {
        const importPath = path.resolve(path.join(nodekitAppPath, 'node_modules', 'svelte'), args.path.replace('..', '.'))
        const resolved = { path: importPath }
        return resolved
      } else {
        return
      }
    })
  }
}
