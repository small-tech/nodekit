import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { withoutWhitespace } from './helpers'

import path from 'path'
import * as utils from '../lib/Utils'

import http from 'http'

const nodeScriptRegExp = /\<data\>(.*?)\<\/data\>/s

const nodeScript = `
export default function (request, response) {
  return { title: 'Hello, world!' }
}
`

const nodeScriptIncludingDataTags = `
<data>
  ${nodeScript}
</data>
`

const topOfPage = `
<!-- Test -->
`

const restOfPage = `
</data>

<script>
  export let data
</script>

<h1>{data.title}</h1>
`
const source = `
${topOfPage}
${nodeScriptIncludingDataTags}    
${restOfPage}
`

const test = suite('Utils')

test('basepath', () => {
  const initialPath = path.resolve('tests/fixtures/emptyProject')
  const initialPathWithSrcFolder = path.resolve('tests/fixtures/emptyProjectWithSrcFolder')
  const nonExistentPath = 'this-path-does-not-exist'

  const basePath = utils.calculateBasePath(initialPath)
  const basePathWithSourceFolder = utils.calculateBasePath(initialPathWithSrcFolder)

  assert.equal(basePath, initialPath)
  assert.equal(basePathWithSourceFolder, path.join(initialPathWithSrcFolder, 'src'))
  assert.throws(() => utils.calculateBasePath(nonExistentPath), error => { return error.message === `Basepath ${nonExistentPath} does not exist`}, 'Non existent paths throw.')
})

test ('privileged ports', async () => {
  utils.ensurePrivilegedPortsAreDisabled()

  // We only need to test the port 80 server since, if that can be created
  // without running into privilege issues, so can the 443 server (as we know
  // the lowest privileged port is set to < 80).
  const port80Server = http.createServer(() => {})

  try {
    await new Promise ((resolve, reject) => { 
      setTimeout(() => reject('timeout'), 500)
      port80Server.on('error', error => {
        reject(error)
      })  
      port80Server.listen(80, () => { resolve() }) 
    })
  } catch (error) {
    assert.unreachable(`Port 80 server should not throw (${error.message})`)
  }

  port80Server.close()
})

test ('class name from route', () => {
  assert.equal(
    utils.classNameFromRoute('/some_route/with/underscores-and-hyphens:and-a-parameter/or:two'), 'SomeRouteWithUnderscoresAndHyphensAndAParameterOrTwoPage'
  )
  assert.equal(utils.classNameFromRoute('/'), 'IndexPage')
})

test ('extract', () => {
  const { normalisedSource, extracted } = utils.extract(source, nodeScriptRegExp)

  assert.equal(withoutWhitespace(normalisedSource), withoutWhitespace(topOfPage + restOfPage))
  assert.equal(withoutWhitespace(extracted), withoutWhitespace(nodeScript))
})

test ('parseSource', () => {
  const { normalisedSource, nodeScript: extracted } = utils.parseSource(source, nodeScriptRegExp)

  assert.equal(withoutWhitespace(normalisedSource), withoutWhitespace(topOfPage + restOfPage))
  assert.equal(withoutWhitespace(extracted), withoutWhitespace(nodeScript))
})

test ('routeFromFilePath', () => {
  const basePath = utils.calculateBasePath()

  const supportedExtensions = ['get', 'head', 'patch', 'options', 'connect', 'delete', 'trace', 'post', 'put', 'page', 'socket']

  // Some manual tests of actual routes in the Domain app (https://github.com/small-tech/domain).
  const expectations = [
    [path.join(basePath, 'index_[property1]_and_[property2].page'), '/:property1/and/:property2'],
    [path.join(basePath, 'index_with_[property1]_and_[property2].page'), '/with/:property1/and/:property2'],
    [path.join(basePath, 'admin/index_[password].socket'), '/admin/:password'],
    [path.join(basePath, 'domain/available_[domain].get'), '/domain/available/:domain'],
    [path.join(basePath, 'private_[token]_[domain].get'), '/private/:token/:domain']
  ]

  for (const supportedExtension of supportedExtensions) {
    expectations.push([
      path.join(basePath, 'a', 'route-with', `this_[property].${supportedExtension}`),
      `/a/route-with/this/:property`
    ])
  }

  for (const expectation of expectations) {
    assert.equal(utils.routeFromFilePath(expectation[0]), expectation[1], expectation[0])
  }
})

test ('nodeKitAppPath', () => {
  // Note: this doesn’t test the app path when run from the nodekit bundle or 
  // the nodekit launch script from source. It only tests it when run from this
  // file in the unit tests.
  assert.equal(utils.nodekitAppPath, path.resolve('.') + '/')
})

test ('loaderPaths', async () => {
  const { nodekitAppPath, svelteExports } = await utils.loaderPaths()

  assert.ok(nodekitAppPath)
  
  const expectedSvelteExports = JSON.stringify({
    './package.json': './package.json',
    '.': {
      types: './types/runtime/index.d.ts',
      browser: { import: './index.mjs', require: './index.js' },
      node: { import: './ssr.mjs', require: './ssr.js' },
      import: './index.mjs',
      require: './index.js'
    },
    './compiler': {
      types: './types/compiler/index.d.ts',
      import: './compiler.mjs',
      require: './compiler.js'
    },
    './animate': {
      types: './types/runtime/animate/index.d.ts',
      import: './animate/index.mjs',
      require: './animate/index.js'
    },
    './easing': {
      types: './types/runtime/easing/index.d.ts',
      import: './easing/index.mjs',
      require: './easing/index.js'
    },
    './internal': {
      types: './types/runtime/internal/index.d.ts',
      import: './internal/index.mjs',
      require: './internal/index.js'
    },
    './motion': {
      types: './types/runtime/motion/index.d.ts',
      import: './motion/index.mjs',
      require: './motion/index.js'
    },
    './register': { require: './register.js' },
    './store': {
      types: './types/runtime/store/index.d.ts',
      import: './store/index.mjs',
      require: './store/index.js'
    },
    './transition': {
      types: './types/runtime/transition/index.d.ts',
      import: './transition/index.mjs',
      require: './transition/index.js'
    },
    './ssr': {
      types: './types/runtime/index.d.ts',
      import: './ssr.mjs',
      require: './ssr.js'
    }
  })
  
  assert.equal(JSON.stringify(svelteExports), expectedSvelteExports)
})

test.run()
