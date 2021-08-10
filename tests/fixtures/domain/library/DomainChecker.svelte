<script>
  import { onMount, createEventDispatcher } from 'svelte'
  import debounce from '$lib/debounce'

  let baseUrl

  const dispatch = createEventDispatcher()

  onMount(() => {
    baseUrl = window.location.hostname
  })

  //////////////////////////////////////////////////////////////////////
  //
  // State
  //
  //////////////////////////////////////////////////////////////////////

  export let config
  export let buttonLabel

  let hostDomain = config.dns.domain

  let domainToCheck = ''
  let checkedDomain = ''
  let domainIsAvailable = false
  let domainStatusIsUnknown = true
  let domainCheckError = false
  let domainCheckErrorMessage = null
  let canSignUp = false

  $: if (domainStatusIsUnknown || domainToCheck.trim() === '') {
    checkedDomain = ''
    domainCheckErrorMessage = null
    domainIsAvailable = false
  }
  $: domainCheckError = domainCheckErrorMessage !== null
  $: canSignUp = !domainStatusIsUnknown && domainIsAvailable

  //////////////////////////////////////////////////////////////////////

  const debouncedInputHandler = debounce(async () => {
    // Client-side validation of valid subdomain names.
    // According to the pertinent internet recommendations (RFC3986 section 2.2,
    // which in turn refers to: RFC1034 section 3.5 and RFC1123 section 2.1),
    // a subdomain (which is a part of a DNS domain hostname), must meet several requirements:
    //
    // • Each subdomain part must have a length no greater than 63.
    // • Each subdomain part must begin and end with an alpha-numeric (i.e. letters [A-Za-z] or digits [0-9]).
    // • Each subdomain part may contain hyphens (dashes), but may not begin or end with a hyphen.
    //
    // (https://stackoverflow.com/a/7933253)
    const validHostnameCharacters = /^[A-Za-z0-9](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?$/
    if (domainToCheck.trim() === '') return
    if (!validHostnameCharacters.test(domainToCheck)) {
      domainCheckErrorMessage = `Sorry, that’s not a valid domain name.`
      return
    }

    const result = await fetch(`https://${baseUrl}/domain/available/${domainToCheck}`)

    if (result.status === 200) {
      const domainCheckResult = await result.json()
      checkedDomain = domainCheckResult.domain
      domainIsAvailable = domainCheckResult.available
      domainStatusIsUnknown = false
    } else {
      try {
        const errorDetails = await result.json()
        domainCheckErrorMessage = `Error ${errorDetails.code}: ${errorDetails.message}`
      } catch (error) {
        domainCheckErrorMessage = error
      }
    }
  }, 300)

  const inputHandler = () => {
    // Signal that input is changing so domain state can be set to neutral.
    domainStatusIsUnknown = true
    debouncedInputHandler()
  }

  const buttonHandler = () => {
    dispatch('create', {
      domain: domainToCheck
    })
  }
</script>


<form on:submit|preventDefault>
  <label for='domain'>Domain (on <strong>{hostDomain}</strong>)</label>

  <div id='domain-status'>
    {#if !domainStatusIsUnknown}
      <div
        class:domain-is-available={domainIsAvailable}
        class:domain-is-not-available={!domainIsAvailable}
      >
        {domainIsAvailable ? '✔️' : '❌️' }
        <strong>{checkedDomain}.{hostDomain}</strong> is
        {@html domainIsAvailable ? '' : '<strong>not</strong>'} available.
      </div>
    {:else}
      {#if domainCheckError}
        <div class=domain-check-error>❌️ {domainCheckErrorMessage}</div>
      {:else}
        <div class=domain-check-instructions>* Letters, numbers, and dashes only. Must begin and end with a letter or number.</div>
      {/if}
    {/if}
  </div>

  <!-- This is the only field and always the next gesture
      so, to remove on gesture for everyone on every use, we autofocus it. -->
  <!-- svelte-ignore a11y-autofocus -->
  <input
    name='domain'
    type='text'
    bind:value={domainToCheck}
    on:input={inputHandler}
    class:domain-is-available={canSignUp}
    class:domain-is-not-available={!domainStatusIsUnknown && !domainIsAvailable}
    autofocus
  >

  <button
  class:can-sign-up={canSignUp}
  class:cannot-sign-up={!canSignUp}
  on:click={buttonHandler}
>
  {buttonLabel || `Sign up for ${config.payment.currency}${config.payment.price}/month.`}
</button>

</form>


<style>
  label {
    display: block;
    margin-bottom: 0.5em;
  }

  input {
    display: inline-block;
  }

  button {
    border: 0;
    color: white;
    border-radius: 1.33em;
    padding-left: 1em;
    padding-right: 1em;
    display: block;
    margin-top: 1.25em;
  }

  .can-sign-up {
    background-color: green;
  }

  .cannot-sign-up {
    background-color: grey;
  }

  #domain-status {
    margin-top: -0.25em;
    margin-bottom: 1em;
  }

  .domain-is-available {
    color: green;
  }

  .domain-check-instructions {
    font-style: italic;
    color:darkolivegreen;
  }

  .domain-is-not-available, .domain-check-error {
    color: red;
  }
</style>
