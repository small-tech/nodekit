// TODO: replace with keyd (isomorphic)
import set from 'keypather/set.js'

export default (remote, message) => {
  // Update the value at a specific key path.
  set(db, message.keyPath, message.value)
}
