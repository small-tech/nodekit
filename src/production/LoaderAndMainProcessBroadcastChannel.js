// We use a regular broadcast channel to communicate with the ESM Loader,
// which is really just another worker process.

import { BroadcastChannel } from 'worker_threads'

export default class LoaderAndMainProcessBroadcastChannel extends BroadcastChannel {
  constructor () {
    super ('loader-and-main-process')
  }
}
