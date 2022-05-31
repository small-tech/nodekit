////////////////////////////////////////////////////////////
//
// NodeKit
//
// Copyright ⓒ 2021-present, Aral Balkan
// Small Technology Foundation
//
// License: AGPL version 3.0.
//
////////////////////////////////////////////////////////////

import path from 'path'

import { ensurePrivilegedPortsAreDisabled, calculateBasePath } from './Utils'
import JSDB from '@small-tech/jsdb'
import server from './server'

// Conditional logging.
console.verbose = process.env.VERBOSE ? function () { console.log(...arguments) } : () => {}

export default class NodeKit extends EventTarget {
  constructor (absolutePathToServe) {
    super()

    this.basePath = calculateBasePath(absolutePathToServe)

    // Ensure database is ready
    // TODO: Keep the database elsewhere outside of the project folder structure. It’s too easy
    // ===== to accidentally upload it somewhere otherwise by messing up your .gitignore (security).
    // globalThis.db = JSDB.open(path.join(this.basePath, '.db'))

    // Save a reference to the app in the global scope also.
    // globalThis.app = this

    // Disable privileged ports on Linux (because we don’t need security
    // theatre to trip us up.)
    ensurePrivilegedPortsAreDisabled()
  }

  async initialise () {
    const ConcreteServer = server()
    this.server = new ConcreteServer(this)
    await this.server.initialise()
  }
}
