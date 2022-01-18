import path from 'path'
import { fileURLToPath, URL } from 'url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const fixturesPath = path.join(__dirname, 'tests', 'fixtures')

import Files from './lib/Files.js'

const domainProjectPath = path.join(fixturesPath, 'persisted-hello-count')
const files = new Files(domainProjectPath)
const filesByExtension = await files.initialise()
