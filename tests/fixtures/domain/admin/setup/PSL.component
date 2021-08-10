<script>
  import Remote from '@small-tech/remote'
  import ServiceState from './ServiceState.js'
  import { PaymentProviders } from '$lib/Constants'

  export let settings

  export let socket
  const remote = new Remote(socket)

  export const state = new ServiceState()

  function validateSettings() {
    state.set(state.UNKNOWN)

    // Domain does not need to be on the Public Suffix List for private instances.
    if (settings.payment.provider === PaymentProviders.none) {
      return state.set(state.OK, { isPrivateInstance: true })
    }

    // Only enter processing state if we need to do a remote call.
    state.set(state.PROCESSING)

    // Otherwise, carry out validation.
    remote.psl.validate.request.send()
  }

  // Remote message handlers.
  remote.settings.handler = () => validateSettings()
  remote.psl.validate.response.handler = () => {
    state.set(state.OK, { isPrivateInstance: false })
  }
  remote.psl.validate.error.handler = message => state.set(state.NOT_OK, { error: message.error })
</script>


<h3 id='psl'>Public Suffix List (PSL) Settings</h3>

{#if $state.is(state.UNKNOWN)}
  <p><strong>Checking if domain is on the Public Suffix List…</strong></p>
{/if}

{#if $state.is(state.OK)}
  {#if state.OK.isPrivateInstance}
    <p><strong>✔️ Private instances do not have be registered on the <a href='https://publicsuffix.org'>Public Suffix List</a>.</strong></p>

    <p>A private instance is one where the payment provider is set to “none” and where domains can only be registered using this administration panel.</p>

    <p>The assumption with private instances is that all subdomains registered on the domain belong to the organisation running the Small Web Domain. If this assumption is incorrect for your use case (and domains are owned by separate entities even though you register them manually from here), you should <a href='https://github.com/publicsuffix/list/wiki/Guidelines'>apply to have your domain added to the PSL.</a></p>

    <p>If you’re not on the PSL, realise that this will allow the domain to set privacy-violating “supercookies” that are valid for all subdomains.</p>

    <p><a href='https://publicsuffix.org/learn/'>Learn more.</a></p>
  {:else}
    <p><strong>✔️ Your domain is on the Public Suffix List.</strong></p>
  {/if}
{/if}

{#if $state.now === state.NOT_OK}
  <p style='color: red;'><strong>❌️ {state.NOT_OK.error}</strong></p>
  <button on:click={validateSettings}>Check again now</button>
{/if}

{#if
  $state.is(state.UNKNOWN)
  || ($state.is(state.OK) && !state.OK.isPrivateInstance)
  || $state.is(state.NOT_OK)
}
  <p>Public instances must be registered on the <a href='https://publicsuffix.org'>Public Suffix List</a> for privacy purposes.</p>

  <p>A public instance is one where the payment provider is set to anything but “none” where members of the public can register their own indepenedent Small Web places using tokens, money, etc.</p>

  <p>Without this requirement, the organisation running the Small Web Domain could set a “supercookie” on the main domain and violate the privacy of the people who own and control the subdomains.</p>

  <p>Additionally, having the domain on the PSL enables browsers to highlight the most important part of a domain name when displaying it and accurately sort history entries by site.</p>

  <p><a href='https://publicsuffix.org/learn/'>Learn more.</a></p>
{/if}

{#if $state.is(state.UNKNOWN) || $state.is(state.NOT_OK)}
  <section class='instructions'>
    <h3>Instructions</h3>
    <ol>
      <li><a href='https://github.com/publicsuffix/list/wiki/Guidelines'>Read the guidelines</a> for submitting a domain to the <a href='https://publicsuffix.org'>Public Suffix List</a>.</li>
      <li>
        <p><a href='https://github.com/publicsuffix/list/pulls'>Submit your pull request</a> to amend the PSL.</p>
        <p>You can use <a href='https://small-web.org'>small-web.org’s pull request</a> as a template. You can also refer to that pull request in yours as an example of a precedent for acceptance of a Small Web Domain onto the Public Suffix List.</p>
        <p>If you have any touble getting accepted, please contact <a href='https://small-tech.org'>Small Technology Foundation</a> at <a href='mailto:'>hello@small-tech.org</a> and we will help.</li>
    </ol>
    <p><strong>Once your domain is on the public suffix list, we will automatically detect the fact and enable your Small Web Domain for public access.</strong></p>
  </section>
{/if}
