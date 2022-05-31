////////////////////////////////////////////////////////////
//
// NodeKit command-line interface (CLI): serve command.
//
// Copyright ⓒ 2021-present, Aral Balkan
// Small Technology Foundation
//
// License: AGPL version 3.0.
//
////////////////////////////////////////////////////////////

import { setBasePath, ensurePrivilegedPortsAreDisabled } from '../../Utils.js'
import Server from '../../Server.js'

console.verbose = process.env.VERBOSE ? function () { console.log(...arguments) } : () => {}

export default async function serve (pathToServe = '.', options) {
  const workingDirectory = options['working-directory']

  const basePath = setBasePath(workingDirectory, pathToServe)
  
  // Disable privileged ports on Linux (because we don’t need security
  // theatre to trip us up.)
  ensurePrivilegedPortsAreDisabled()

  console.verbose('Starting NodeKit (Production Mode)…')
  console.verbose('Serving', basePath)

  const server = new Server()
  await server.initialise()
}

