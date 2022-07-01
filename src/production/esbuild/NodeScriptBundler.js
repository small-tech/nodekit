// Compiles and links the passed NodeScript.
import vm from 'vm'
import esbuild from 'esbuild'
import path from 'path'

export default async function nodeScriptBundler (nodeScript, basePath, sourceFilePath) {
  let buildResult
  
  // TODO: Make this a singleton? 
  const context = globalThis.context

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

  const identifier = `nodescript error in ${sourceFilePath.replace(basePath + path.sep, '')}`

  const bundle = buildResult.outputFiles[0].text
  const module = new vm.SourceTextModule(bundle, { context, identifier })

  await module.link(async (specifier, _referencingModule) => {
    return new Promise(async (resolve, _reject) => {
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

  // Return the module (which, in the case of NodeScript, is a function
  // that is ready to be called and the source for the module. The latter
  // can be used to display the exact error location for runtime errors.)
  return {
    module: module.namespace.default,
    source: bundle
  }
}
