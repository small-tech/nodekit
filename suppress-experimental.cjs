////////////////////////////////////////////////////////////////////////////////
// We know we’re using experimental features here as the whole system is based
// on them. And we document it, so no need to also mess up the console output.
//
// Requires Node to be started with:
// NODE_OPTIONS='--require=./suppress-experimental.cjs'
//
// Original method by Corey Farrell worked up to Node 16.x.
// (https://github.com/nodejs/node/issues/30810#issue-533506790)
//
// Current method based on the method used in Yarn.
// (https://github.com/yarnpkg/berry/blob/2cf0a8fe3e4d4bd7d4d344245d24a85a45d4c5c9/packages/yarnpkg-pnp/sources/loader/applyPatch.ts#L414-L435)
//
////////////////////////////////////////////////////////////////////////////////

// When using the ESM loader Node.js prints either of the following warnings
//
// - ExperimentalWarning: --experimental-loader is an experimental feature. This feature could change at any time
// - ExperimentalWarning: Custom ESM Loaders is an experimental feature. This feature could change at any time
//
// Having this warning show up once is "fine" but it's also printed
// for each Worker that is created so it ends up spamming stderr.
// Since that doesn't provide any value we suppress the warning.
const originalEmit = process.emit;

process.emit = function (name, data, ...args) {
  if (
    name === 'warning' &&
    typeof data === 'object' &&
    data.name === 'ExperimentalWarning' &&
    (data.message.includes('--experimental-loader') ||
      data.message.includes('Custom ESM Loaders is an experimental feature') ||
			data.message.includes('The Node.js specifier resolution flag is experimental') ||
			data.message.includes('Importing JSON modules is an experimental feature'))
  )
    return false

  return originalEmit.apply(process, arguments)
}

