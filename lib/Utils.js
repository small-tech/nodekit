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

// Svelte’s hash function (djb2)
// https://github.com/sveltejs/kit/blob/eb96322f25b08af8e0f814a825a5db28c6794f50/packages/kit/src/runtime/hash.js
// See https://github.com/sveltejs/kit/issues/1582#issuecomment-890341017
function svelteHash(value) {
	let hash = 5381;
	let i = value.length;

	if (typeof value === 'string') {
		while (i) hash = (hash * 33) ^ value.charCodeAt(--i);
	} else {
		while (i) hash = (hash * 33) ^ value[--i];
	}

	return (hash >>> 0).toString(36);
}

function extract(source, regExp) {
  const result = regExp.exec(source)
  return result ? {
    normalised: source.replace(result[0], ''),
    extracted: result[1]
  } : { normalised: source, extracted: '' }
}

// Regular expressions for all blocks that need to be extracted
// from the NodeKit source by the parseSource function. (The svelte:… tags
// are extracted as they must be top-level as per Svelte compiler requirements.)
const nodeScriptRegExp = /\<data\>(.*?)\<\/data\>/s
const svelteHeadRegExp = /\<svelte:head\>(.*?)\<\/svelte:head>/s
const svelteBodyRegExp = /\<svelte:body(.*?)\/>/s
const svelteWindowRegExp = /\<svelte:window(.*?)\/>/s
const svelteOptionsRegExp = /\<svelte:options(.*?)\/>/s
const scriptRegExp = /\<script\>(.*?)\<\/script\>/s
const moduleScriptRegExp = /\<script\s*?context=['"]?module['"]?\>(.*?)\<\/script\>/s
const styleRegExp = /\<style\>(.*?)\<\/style\>/s

export function parseSource(source) {
  let normalised, nodeScript, script, moduleScript, style, head, body, window, options

  console.time('regexp')
  normalised = source
  ;({normalised, extracted: nodeScript} = extract(normalised, nodeScriptRegExp))
  ;({normalised, extracted: script} = extract(normalised, scriptRegExp))
  ;({normalised, extracted: moduleScript} = extract(normalised, moduleScriptRegExp))
  ;({normalised, extracted: style} = extract(normalised, styleRegExp))
  ;({normalised, extracted: head} = extract(normalised, svelteHeadRegExp))
  ;({normalised, extracted: body} = extract(normalised, svelteBodyRegExp))
  ;({normalised, extracted: window} = extract(normalised, svelteWindowRegExp))
  ;({normalised, extracted: options} = extract(normalised, svelteOptionsRegExp))
  console.timeEnd('regexp')

  // At this point, the only thing that remains in normalised should be
  // the HTML/Svelte component source (no NodeScript, no script block, and no
  // style block). Wrap this in a root node.
  //
  // The class of the block is a hash of the svelte/HTML source and the script.
  //
  // (The style is not included as it is hashed separately by Svelte and is
  // injected separately if changed.)
  const componentClass = svelteHash(normalised + script)
  
  normalised = `${script ? `<script>${script}</script>` : ''}${moduleScript ? `\n\n<script context='module'>${moduleScript}</script>` : ''}${head ? `\n\n<svelte:head>${head}</svelte:head>` : ''}${window ? `\n\n<svelte:window ${window}/>` : ''}${body ? `\n\n<svelte:body ${body}/>` : ''}${options ? `\n\n<svelte:options ${options}/>` : ''}<div class='nodekit-${componentClass}' style='display: contents;'>${normalised.trim()}</div>${style ? `<style>${style}</style>` : ''}`

  return { normalised, nodeScript, script, moduleScript, style, head, body, window }
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
  const svelteExports = (await import(`${nodekitAppPath}/node_modules/svelte/package.json`)).default.exports
  return { nodekitAppPath, svelteExports }
}
