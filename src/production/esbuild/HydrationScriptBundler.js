// Compile, link, and return (using esbuild) the client-side hydration script for a page.

// Adapted from:
// https://esbuild.github.io/plugins/#svelte-plugin
import esbuild from 'esbuild'
import resolveSvelteRoutesPlugin from './plugins/ResolveSvelteRoutesPlugin'
import sveltePlugin from './plugins/SveltePlugin'

export async function createHydrationScriptBundle (relativePagePath, route) {
  console.verbose('  • Compiling hydration script for', relativePagePath)
  console.verbose(' --> cwd', process.cwd())
  console.profileTime(`  • Hydration script compiled: ${relativePagePath}`)
  let result
  try {
    result = await esbuild.build({
      entryPoints: [relativePagePath.replace('../../../', '')],
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

