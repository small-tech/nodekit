////////////////////////////////////////////////////////////////////////////////
// We know we’re using experimental features here as the whole system is based
// on them. And we document it, so no need to also mess up the console output.
//
// Requires Node to be started with:
// NODE_OPTIONS='--require=./suppress-experimental.cjs'
//
// Courtesy of Corey Farrell
// https://github.com/nodejs/node/issues/30810#issue-533506790
//
////////////////////////////////////////////////////////////////////////////////

const {emitWarning} = process;

process.emitWarning = (warning, ...args) => {
	if (args[0] === 'ExperimentalWarning') {
		return
	}

	if (args[0] && typeof args[0] === 'object' && args[0].type === 'ExperimentalWarning') {
		return
	}

	return emitWarning(warning, ...args)
}
