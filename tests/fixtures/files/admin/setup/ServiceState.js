import State from '@small-tech/state'

export default class ServiceState {
  constructor () {
    return new State ({
      UNKNOWN: {},
      PROCESSING: {},
      OK: {},
      NOT_OK: {}
    })
  }
}
