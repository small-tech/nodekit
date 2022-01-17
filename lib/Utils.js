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
    .replace(basePath, '')                  // Remove the base path.
    .replace(indexWithPropertiesRegExp, '/') // Handle index files that contain properties.
    .replace(/_/g, '/')                     // Replace underscores with slashes.
    .replace(/\[(.*?)\]/g, ':$1')           // Replace properties. e.g., [prop] becomes :prop
    .replace(indexWithExtensionRegExp, '')  // Remove index path fragments (and their extensions)
    .replace(extensionRegExp, '')           // Remove extension.
}
