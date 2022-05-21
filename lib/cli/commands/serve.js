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

import fs from 'fs'
import path from 'path'
import NodeKit from '../../NodeKit'

console.verbose = process.env.VERBOSE ? function () { console.log(...arguments) } : () => {}

export default async function serve (pathToServe, options) {
  // Resolve the path to serve so that it works both when run as
  // nodekit <path to serve> from anywhere and, from the source folder, as
  // bin/nodekit <path to serve>.
  const _basePath = options['base-path'] === '/' ? '.' : options['base-path']
  const _pathToServe = pathToServe === undefined ? '.' : pathToServe
  const absolutePathToServe = path.resolve(_basePath, _pathToServe)

  if (!fs.existsSync(absolutePathToServe)) {
    console.error(`${absolutePathToServe} not found.`)
    process.exit(1)
  }

  console.verbose('Starting NodeKit…')
  console.verbose('Serving', absolutePathToServe)
  const nodeKit = new NodeKit(absolutePathToServe)
  await nodeKit.initialise()
}
