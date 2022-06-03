// Add an onFinish handler to tape that exits the process since we’re using
// a custom ES Module Loader with a broadcast channel in the app that will
// otherwise keep the process alive even after the tests are complete.

import _test from '@small-tech/tape-with-promises'
_test.onFinish(() => process.exit())
export const test = _test

// Monkey patch sdtout.write() to capture output for tests.
// Thanks to https://gajus.medium.com/capturing-stdout-stderr-in-node-js-using-domain-module-3c86f5b1536d

class StandardOutput {
  constructor () {
    this._output = ''
    this.originalWriteMethod = process.stdout.write.bind(process.stdout)
  }

  get capturedContents () {
    return this._output
  }

  capture () {
    this._output = ''
    process.stdout.write = this.write.bind(this)
  }

  stopCapturing () {
    process.stdout.write = this.originalWriteMethod
    return this._output
  }

  // Private

  write (chunk, encoding, callback) {
    if (typeof chunk === 'string') {
      this._output += chunk
    }

    return this.originalWriteMethod(chunk, encoding, callback)
  }
}

export const standardOutput = new StandardOutput()

// Remove all whitespace from a string (used in string comparisons
// where whitespace is not important).

export function withoutWhitespace (string) {
  return string.replace(/\s/g, '')
}
