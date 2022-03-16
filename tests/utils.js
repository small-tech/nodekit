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

test.run()
