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
