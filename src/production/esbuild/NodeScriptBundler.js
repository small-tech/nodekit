// Compiles and links the passed NodeScript.
import vm from 'vm'
import esbuild from 'esbuild'
import { fetch } from 'undici'

// The virtual machine context used to run NodeScript in.
const context = vm.createContext({
  // NodeKit globals.
  db: globalThis.db,
  // The app itself for advanced uses.
  app: globalThis.app,
  // Node.js globals.
  console, URLSearchParams, URL, process,
  // (Fetch is part of undici right now but slated to be part
  // of Node 16 under an experimental flag and Node 18 without.
  // Once that lands, we can replace this with the standard
  // implementation.)
  fetch
})

export default async function nodeScriptBundler (nodeScript, basePath) {
  let buildResult

  // Note: throws. Catch in caller.
  buildResult = await esbuild.build({
    stdin: {
      contents: nodeScript,
      resolveDir: basePath,
      sourcefile: 'node-script.js',
      loader: 'js'
    },
    bundle: true,
    format: 'esm',
    platform: 'node',
    write: false
  })

  const bundle = buildResult.outputFiles[0].text
  const module = new vm.SourceTextModule(bundle, { context })

  await module.link(async (specifier, referencingModule) => {
    return new Promise(async (resolve, reject) => {
      console.verbose('Linking: ', specifier)

      const module = await import(specifier)
      const exportNames = Object.keys(module)

      // In order to interoperate with Node’s own ES Module Loader,
      // we have to resort to creating a synthetic module to
      // translate for us.
      //
      // Thanks to László Szirmai for the tactic
      // (https://github.com/nodejs/node/issues/35848).
      const syntheticModule = new vm.SyntheticModule(
        exportNames,
        function () {
          exportNames.forEach(key => {
            this.setExport(key, module[key])
        })
      }, { context })

      resolve(syntheticModule)
    })
  })

  // Evaluate the module. After successful completion of this step,
  // the module is available from the module.namespace reference.
  await module.evaluate()

  return module.namespace.default
}
