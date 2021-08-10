<script context='module'>
  export async function load({page, fetch}) {

    // Check if the domain exists and 404 if not.
    // TODO: use actual hostname during production. (How?)
    const domainStatusResponse = await fetch(`https://localhost/domain/available/${page.params.domain}`)

    console.log('...', domainStatusResponse)

    if (domainStatusResponse.status !== 200) {
      const details = await domainStatusResponse.text()

      return {
        props: {
          serverError: {
            details
          },
          domain: ''
        }
      }
    }

    const domainStatus = await domainStatusResponse.json()

    console.log(domainStatus)

    if (domainStatus.available) {
      return {
        status: 404,
        error: 'Domain not found.'
      }
    }

    const response = await fetch('/ssr/config')

    if (response.status !== 200) {
      const details = await response.text()

      return {
        props: {
          serverError: {
            details
          },
          config: {site: {}, dns: {}, payment: {}},
          domain: ''
        }
      }
    }

    const config = await (response).json()
    return {
      props: {
        config,
        domain: page.params.domain
      }
    }
  }
</script>

<script>
  // @hmr:keep-all

  import { authenticate } from '$lib/keys.js'
  import { onMount } from 'svelte'

  // Implement global Buffer support.
  import { Buffer } from 'buffer'
  globalThis.Buffer = Buffer

  // Props
  export let config
  export let domain

  let shouldShowSavedMessage = false

  let errorMessage = null
  let password = null
  let signingIn = false

  let signedIn = false
  let baseUrl

  let socket

  onMount(async () => {
    baseUrl = document.location.hostname
  })

  const duration = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }

  function showSavedMessage() {
    if (shouldShowSavedMessage) return
    shouldShowSavedMessage = true
    setTimeout(() => shouldShowSavedMessage = false, 1500)
  }

  async function signIn () {
    // Get the token.
    const token = await authenticate (domain, password)

    // Open a socket connection using the token.

    signingIn = true
    try {
      socket = new WebSocket(`wss://${baseUrl}/manage/${token}/${domain}`)
    } catch (error) {
      errorMessage = `WebSocket ${error}.`
      signingIn = false
      return
    }

    socket.onopen = () => {
      console.log('Socket open.')
    }

    socket.onerror = event => {
      errorMessage = 'WebSocket connection failed (<strong>is Site.js running?</strong>)'
      signingIn = false
    }

    socket.onclose = event => {
      signingIn = false
      signedIn = false
      console.log(`Socket closed.`)
    }

    socket.onmessage = async event => {
      const message = JSON.parse(event.data)
      switch (message.type) {

        case 'authorisation-success':
          signingIn = false
          signedIn = true
        break

        case 'authorisation-failure':
          signingIn = false
          signedIn = false
          errorMessage = 'Authorisation failed.'
        break

        default:
          console.error('Unknown message', message)
        break
      }
    }
  }
</script>

<main>
  <h1>Manage your place</h1>

  <h2>{domain}.{config.dns.domain}</h2>

  {#if !signedIn}
    <p>Please sign in to access this page.</p>
    <form on:submit|preventDefault>
      <label for='password'>Password:</label>
      <input name='password' type='password' bind:value={password}/>
      <button on:click={signIn}>Sign in</button>
    </form>

    {#if signingIn}
      <p style='color: blue;'>Signing in…</p>
    {/if}

    {#if errorMessage}
      <p style='color: red;'>❌️ {@html errorMessage}</p>
    {/if}
  {:else}
    <h3 style='color: green;'>✔️ Signed in. TODO.</h3>
  {/if}
</main>


<style>
  main {
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }

  input, textarea, select {
    display: block;
    margin-top: 0.5em;
    margin-bottom: 1em;
  }

  label, .label {
    margin-bottom: 0.5em;
  }

  *:global(.appLogo) {
    display: inline-block;
  }

  *:global(.appLogo svg) {
    border: 1px solid black;
    padding: 1em;
    width: 3em;
    height: 3em;
    vertical-align: middle;
  }

  .inline {
    display: inline;
  }

  .block {
    display: block;
  }

  .positive {
    color: green;
  }

  .warning {
    color: orange;
  }

  .negative {
    color: red;
  }


  button {
    min-width: 4.5em;
  }

  fieldset {
    max-width: 10em;
  }

</style>
