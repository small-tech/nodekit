import { suite } from 'uvu'
import * as assert from 'uvu/assert'

import router from '../lib/router.js'

const test = suite()

test('should initialise', async () => {
  assert.equal(await router(), true, 'return value should be true')
})

test.run()
