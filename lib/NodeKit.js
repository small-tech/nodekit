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
import Server from './server'

// Conditional logging.
console.verbose = process.env.VERBOSE ? function () { console.log(...arguments) } : () => {}

export default class NodeKit extends EventTarget {
  constructor (basePath = process.cwd()) {
    super()

    // You can place your source files either in the project
    // folder directly or in a subfolder called src.
    //
    // The basePath is stored here and also as an environment variable so the 
    // ESM Module Loader can access it also. It can use it to ensure that it
    // saves the route cache for compiled Svelte files using the same route key
    // we’re using. (The loader otherwise cannot know what basePath was supplied.)
    this.basePath = calculateBasePath()

    // Ensure database is ready
    // TODO: Keep the database elsewhere outside of the project folder structure. It’s too easy
    // ===== to accidentally upload it somewhere otherwise by messing up your .gitignore (security).
    globalThis.db = JSDB.open(path.join(this.basePath, '.db'))

    // Save a reference to the app in the global scope also.
    globalThis.app = this

    // Disable privileged ports on Linux (because we don’t need security
    // theatre to trip us up.)
    ensurePrivilegedPortsAreDisabled()
  }

  async initialise () {
    this.server = new Server()
    await this.server.initialise()
  }
}
