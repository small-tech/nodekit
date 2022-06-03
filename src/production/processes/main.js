////////////////////////////////////////////////////////////
//
// NodeKit main process; command-line interface (CLI)
//
// Copyright ⓒ 2021-present, Aral Balkan
// Small Technology Foundation
//
// License: AGPL version 3.0.
//
////////////////////////////////////////////////////////////

import CLI from '../cli'

const cli = new CLI()
cli.parse(process.argv)

