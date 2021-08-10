// TODO: replace with keyd (isomorphic)
const set = require('keypather/set')

module.exports = (remote, message) => {
  // Update the value at a specific key path.
  set(db, message.keyPath, message.value)
}
