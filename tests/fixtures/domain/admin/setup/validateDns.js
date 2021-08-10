
export default async function (state, settings, remote) {
  state.set(state.PROCESSING)
  if (
    settings.dns.domain !== ''
    && parseInt(settings.dns.accountId) !== NaN
    && settings.dns.accessToken !== ''
  ) {
    // Request remote validation.
    const response = await remote.dns.validate.request.await()
    if (response.error) {
      console.log(response)
      console.log(response.error)
      return state.set(state.NOT_OK, { error: response.error })
    }
    state.set(state.OK)
  } else {
    // Preliminary client-side checks failed.
    state.set(state.NOT_OK)
  }
}
