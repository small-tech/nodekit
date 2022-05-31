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

import { setBasePath, ensurePrivilegedPortsAreDisabled } from '../../Utils'
import server from '../../server'

console.verbose = process.env.VERBOSE ? function () { console.log(...arguments) } : () => {}

export default async function serve (pathToServe = '.', options) {
  const workingDirectory = options['working-directory']

  setBasePath(workingDirectory, pathToServe)
  
  // Disable privileged ports on Linux (because we don’t need security
  // theatre to trip us up.)
  ensurePrivilegedPortsAreDisabled()

  console.verbose('Starting NodeKit…')
  console.verbose('Serving', absolutePathToServe)

  const ConcreteServer = server()
  new ConcreteServer()
  await this.server.initialise()
}
