import os from 'os'
import childProcess from 'child_process'
import process from 'process'

// Linux has an archaic security restriction dating from the mainframe/dumb-terminal era where
// ports < 1024 are “privileged” and can only be connected to by the root process. This has no
// practical security advantage today (and actually can lead to security issues). Instead of
// bending over backwards and adding more complexity to accommodate this, we use a feature that’s
// been in the Linux kernel since version 4.11 to disable privileged ports.
//
// As this change is not persisted between reboots and takes a trivial amount of time to
// execute, we carry it out every time.
//
// For more details, see: https://source.small-tech.org/site.js/app/-/issues/169
export function ensurePrivilegedPortsAreDisabled () {
  if (os.platform() === 'linux') {
    try {
      console.verbose(' 😇 ❨NodeKit❩ Linux: about to disable privileged ports so we can bind to ports < 1024.')
      console.verbose('    ❨NodeKit❩ For details, see: https://source.small-tech.org/site.js/app/-/issues/169')

      childProcess.execSync('sudo sysctl -w net.ipv4.ip_unprivileged_port_start=0', {env: process.env})
    } catch (error) {
      console.error(`\n ❌ ❨NodeKit❩ Error: Could not disable privileged ports. Cannot bind to port 80 and 443. Exiting.`, error)
      process.exit(1)
    }
  }
}

// Converts a route in the form of, e.g.,
// '/some_thing/with/underscores-and-hyphens' to
// SomeThingWithUnderscoresAndHyphensPage
export function classNameFromRoute (route) {
  const className = route
    .split('/').join('*')
    .split('-').join('*')
    .split('_').join('*')
    .split(':').join('*')
    .split('*')
    .map(fragment => fragment.charAt(0).toUpperCase() + fragment.slice(1))
    .join('')
    + 'Page'

  return className === 'Page' ? 'IndexPage' : className
}

//
// Source code parsing.
//

/**
 * Extract the string matched by the regex and return both the resulting string
 * and the matched string.
 *  
 * @param {string} source 
 * @param {RegExp} regExp 
 * @returns 
 */
function extract(source, regExp) {
  const result = regExp.exec(source)
  return result ? {
    normalisedSource: source.replace(result[0], ''),
    extracted: result[1]
  } : { normalisedSource: source, extracted: '' }
}

/**
 * Matches NodeScript data blocks.
 */
const nodeScriptRegExp = /\<data\>(.*?)\<\/data\>/s

/**
 * Parses the source and returns the normalised source and the NodeScript.
 * 
 * @param {string} source 
 * @returns {{normalisedSource: string, nodeScript: string}}
 */
export function parseSource(source) {
  // Currently, all we do is extract the node script block and return it separately.
  const { normalisedSource, extracted: nodeScript } = extract(source, nodeScriptRegExp)
  return { normalisedSource, nodeScript }
}

//
// This function can be called from either the main process or the Node ES Loader,
// and relies on process.env.basePath being set by the main process prior to use.
//

export const HTTP_METHODS = ['get', 'head', 'patch', 'options', 'connect', 'delete', 'trace', 'post', 'put']
export const supportedExtensions = `\.(page|socket|${HTTP_METHODS.join('|')})$`

const indexWithExtensionRegExp = new RegExp(`index${supportedExtensions}`)
const indexWithPropertiesRegExp = /\/index_(?!\/)/
const extensionRegExp = new RegExp(supportedExtensions)

export function routeFromFilePath (filePath) {
  const basePath = process.env.basePath

  return filePath
    .replace(basePath, '')                   // Remove the base path.
    .replace(indexWithPropertiesRegExp, '/') // Handle index files that contain properties.
    .replace(/_/g, '/')                      // Replace underscores with slashes.
    .replace(/\[(.*?)\]/g, ':$1')            // Replace properties. e.g., [prop] becomes :prop.
    .replace(indexWithExtensionRegExp, '')   // Remove index path fragments (and their extensions).
    .replace(extensionRegExp, '')            // Remove extension.
}

// Format the NodeKit app path and the Svelte exports path in a way
// that works regardless of whether NodeKit was invoked using the global command
// from the bundled distribution or via bin/nodekit from source.

export const nodekitAppPath = process.argv[1].replace('nodekit-bundle.js', '').replace('bin/nodekit.js', '')

export async function loaderPaths () {
  const svelteExports = (await import(`${nodekitAppPath}/node_modules/svelte/package.json`, {assert: {type: 'json'}})).default.exports   
  return { nodekitAppPath, svelteExports }
}
