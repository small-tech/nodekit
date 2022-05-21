import { test, withoutWhitespace } from './helpers'

import fs from 'fs'
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

test('basepath', t => {
  const initialPath = path.resolve('tests/fixtures/emptyProject')
  const initialPathWithSrcFolder = path.resolve('tests/fixtures/emptyProjectWithSrcFolder')
  
  // Since these are empty folders, they will not be held in the 
  // git repository. So we ensure they exist and create them if they do not
  // our test doesn’t fail erroneously.
  if (!fs.existsSync(initialPath)) {
    fs.mkdirSync(initialPath)
  }
  
  if (!fs.existsSync(initialPathWithSrcFolder)) {
    fs.mkdirSync(path.join(initialPathWithSrcFolder, 'src'), {recursive: true})
  }
  
  const nonExistentPath = 'this-path-does-not-exist'

  const basePath = utils.calculateBasePath(initialPath)
  const basePathWithSourceFolder = utils.calculateBasePath(initialPathWithSrcFolder)

  t.equal(basePath, initialPath)
  t.equal(basePathWithSourceFolder, path.join(initialPathWithSrcFolder, 'src'))
  t.throws(() => utils.calculateBasePath(nonExistentPath), error => { return error.message === `Basepath ${nonExistentPath} does not exist`}, 'Non existent paths throw.')

  t.end()
})

test ('privileged ports', async t => {
  utils.ensurePrivilegedPortsAreDisabled()

  // We only need to test the port 80 server since, if that can be created
  // without running into privilege issues, so can the 443 server (as we know
  // the lowest privileged port is set to < 80).
  const port80Server = http.createServer(() => {})

  await t.doesNotReject(async () => {
    await new Promise ((resolve, reject) => { 
      const timeoutInterval = setTimeout(() => reject('timeout'), 500)
      port80Server.on('error', error => {
        reject(error)
      })  
      port80Server.listen(80, () => {
        clearInterval(timeoutInterval) 
        resolve() 
      }) 
    })
  })

  port80Server.close()

  t.end()
})

test ('class name from route', t => {
  t.equal(
    utils.classNameFromRoute('/some_route/with/underscores-and-hyphens:and-a-parameter/or:two'), 'SomeRouteWithUnderscoresAndHyphensAndAParameterOrTwoPage'
  )
  t.equal(utils.classNameFromRoute('/'), 'IndexPage')
  t.end()
})

test ('extract', t => {
  const { normalisedSource, extracted } = utils.extract(source, nodeScriptRegExp)

  t.equal(withoutWhitespace(normalisedSource), withoutWhitespace(topOfPage + restOfPage))
  t.equal(withoutWhitespace(extracted), withoutWhitespace(nodeScript))
  t.end()
})

test ('parseSource', t => {
  const { normalisedSource, nodeScript: extracted } = utils.parseSource(source, nodeScriptRegExp)

  t.equal(withoutWhitespace(normalisedSource), withoutWhitespace(topOfPage + restOfPage))
  t.equal(withoutWhitespace(extracted), withoutWhitespace(nodeScript))
  t.end()
})

test ('routeFromFilePath', t => {
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
    t.equal(utils.routeFromFilePath(expectation[0]), expectation[1], expectation[0])
  }

  t.end()
})

test ('nodeKitAppPath', t => {
  // Note: this doesn’t test the app path when run from the nodekit bundle or 
  // the nodekit launch script from source. It only tests it when run from this
  // file in the unit tests.
  t.equal(utils.nodekitAppPath, path.resolve('.') + '/')
  t.end()
})

test ('loaderPaths', async t => {
  const { nodekitAppPath, svelteExports } = await utils.loaderPaths()

  t.ok(nodekitAppPath)
  
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
  
  t.equal(JSON.stringify(svelteExports), expectedSvelteExports)
  t.end()
})
