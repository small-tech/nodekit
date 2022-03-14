// Compile, link, and return (using esbuild) the
// client-side hydration script for a page.

// Adapted from:
// https://esbuild.github.io/plugins/#svelte-plugin
import esbuild from 'esbuild'
import resolveSvelteRoutesPlugin from './plugins/ResolveSvelteRoutesPlugin'
import sveltePlugin from './plugins/SveltePlugin'

export async function createHydrationScriptBundle (relativePagePath, route) {
  console.verbose('  • Compiling hydration script for', relativePagePath)
  console.profileTime(`  • Hydration script compiled: ${relativePagePath}`)
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
        resolveSvelteRoutesPlugin,
        sveltePlugin(route),
      ],
    })
  } catch (error) {
    console.error('esbuild error', error)
    process.exit(1)
  }

  const code = new TextDecoder().decode(result.outputFiles[0].contents)
  console.profileTimeEnd(`  • Hydration script compiled: ${relativePagePath}`)
  return code
}
