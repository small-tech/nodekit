<get>
  import getConfig from './getConfig.js'

  export async request => {
    const config = getConfig()
    return {
      config,
      domain: request.query.url || ''
      app: request.query.app || 'Place'
    }
  }
</get>

<script>
  import Remote from '@small-tech/remote'

  import DomainChecker from '$lib/DomainChecker.svelte'
  import { SvelteToast, toast } from '@zerodevx/svelte-toast'
  import Modal from '$lib/Modal.svelte'
  import { onMount } from 'svelte'
  import stretchy from '$lib/stretchy.js'
  import { goto } from '$app/navigation'

  import { browser } from '$app/env'

  export let serverError // ??? still necesary with NodeKit?

  // This is the data that’s automatically populated during
  // server-side render by NodeKit. (It’s what’s returned
  // from the <get></get> section, above.)
  export let data

  const PAYMENT_PROVIDERS = {
    none: 0,
    token: 1,
    stripe: 2
  }

  const paymentIsNone = data.config.payment.provider === PAYMENT_PROVIDERS.none
  const paymentIsToken = data.config.payment.provider === PAYMENT_PROVIDERS.token
  const paymentIsStripe = data.config.payment.provider === PAYMENT_PROVIDERS.stripe

  let ws
  let mounted = false
  let remote
  let baseUrl

  onMount(() => {
    console.log('==== onmount ====')
    mounted = true
    baseUrl = document.location.host
    const  hostname = document.location.hostname
    console.log(`wss://${hostname}/`)
    ws = new WebSocket(`wss://${hostname}/`)
    remote = new Remote(ws)

    // Check if this is a load triggered as a return url from
    // a provider. Currently, the only supported return urls are
    // for Stripe.

    // const params = new URLSearchParams(document.location.search)
    // const provider = params.get('from')
    // if (provider) {
    //   const action = params.get('action')
    //   if (action === 'back' || action === 'subscribe') {
    //     const sessionId = params.get('session_id')
    //     domain = params.get('domain')
    //     app = params.get('app')

    //     console.log('>>>>', provider, action, domain, app, sessionId)

    //     if (action === 'cancel') {

    //     }

    //   } else {
    //     console.warn('Unknown Stripe action recieved, ignoring.', action)
    //   }

    // } else {
    //   console.warn('Unknown provider in params, ignoring.', provider)
    // }
  })

  console.log(data.config)

  async function handleButton() {
    if (paymentIsNone) {
      return goto('/admin')
    }

    if (paymentIsStripe) {
      console.log('Asking', baseUrl)
      const response = await remote.create.checkout.session.request.await({
        baseUrl,
        data.domain,
        data.app
      })
      console.log('>>>> Got response', response)
      if (response.error) {
        // TODO: handle error
      } else {
        window.location = response.url
      }
    }
  }
</script>

{#if data.config.payment.mode === 'test'}
  <div class='testMode'>Test Mode</div>
{/if}

<main class='site'>
  {#if !serverError}
    <form>
      <!--
        Note: using an en-space instead of a standard space after the conditional, below, due
        ===== to the following Svelte bug. TODO: use a regular space once bug has been fixed.
        https://github.com/sveltejs/svelte/issues/6381
      -->
      {#if paymentIsNone}
        <p>{data.config.dns.domain}</p>
        <aside>
          <p><strong>This is a private instance.</strong></p>
          <p>Please <a href='mailto:{data.config.org.email}'>contact your administrator</a> for help in setting up your own place or use a public domain like <a href='https://small-web.org'>small-web.org</a>.</p>
        </aside>
      {:else}
        <p>I {#if paymentIsToken}have a token and I{/if} want my own
          <select bind:value={data.app}>
            <option value='Place'>Place</option>
            <option value='Site.js'>Site.js</option>
            <option value='Owncast'>Owncast</option>
          </select>
          at
          <!-- <span class='domain'><input type='text' placeholder='domain' bind:value={domain}>.{data.config.dns.domain}</span>{#if paymentIsStripe}&#8197;for €10/month{/if}.</p> -->
          <span class='domain' contenteditable='true' placeholder='domain' bind:textContent={data.domain}/>.{data.config.dns.domain}{#if paymentIsStripe}&#8197;for €10/month{/if}.</p>
       {/if}
       <button on:click|preventDefault={handleButton}>{#if paymentIsNone}Admin panel{:else}Get started!{/if}</button>
    </form>

    <!-- TODO: Add actual sign-in link. -->
    <p class='sign-in'>Already have a place? <a href=''>Sign in.</a></p>

    {#if !paymentIsNone}
      <p><strong>Need help?</strong> Email Laura and Aral at <a href='mailto:{data.config.org.email}'>{data.config.org.email}.</a></p>
    {/if}

    <footer>
      <!--<p><strong>Like this? <a href='https://small-tech.org/fund-us'>Help fund the folks who make it.</a></strong></p>-->
      <p>This is a <a href='https://small-tech.org/research-and-development'>Small Web</a> Domain run by <a href='{data.config.org.site}'>{data.config.org.name}.</a>
        {#if !paymentIsNone}
          <br>
          <a href=''>Terms of Service</a>.
          <a href=''>Privacy Policy.</a>
        {/if}
      <a href='https://github.com/small-tech/basil'>View Source.</a></p>
    </footer>
  {:else}
    <section id=server-error>
      <h1>Server error</h1>
      <pre>{serverError.details}</pre>
      {#if serverError.details.includes('ECONNREFUSED')}
        <p><strong>This is likely because Site.js is not running.</strong></p>
      {/if}
    </section>
  {/if}
</main>

<!-- <SvelteToast /> -->

<style>

  /* Content editable area placeholder hack */
  [contenteditable=true]:empty::before {
    content: attr(placeholder);
    opacity: 0.6;
  }

  :global(body) {
    margin: 0;
    padding: 0;
  }

  aside {
    font-size: 1.5em;
    margin-bottom: 1.75em;
  }

  .keep-together {
    white-space: nowrap;
  }

  .sign-in {
    font-size: 1.5em;
  }

  button {
    font-size: 2em;
    border: 0px;
    background-color: #1CAC78;
    color: white;
    display: block;
    margin-bottom: 1.5em;
  }

  a {
    color: #1F75FE;
  }

  main {
    padding: 1em;
    max-width: 760px;
    margin-left: auto;
    margin-right: auto;
  }

  footer {
    border-top: 1px solid black;
    margin-top: 3em;
  }

  footer > p {
    font-size: 1em;
  }

  p {
    font-size: 1.25em;
  }

  form > p {
    font-size: 4em;
    font-weight: 300;
    line-height: 1.5em;
    margin-bottom: 0.75em;
  }

  select, .domain {
    border: 0;
    border-bottom: 3px solid black;
    border-radius: 0;
  }

  select {
    appearance: none;
    display: inline-block;
    font-size: 1em;
    text-align: center;
    font-weight: 600;
    padding: 0;
    text-align: center;
    color: #1CAC78;
  }

  select option {
    font-size: 0.5em;
  }

  .domain {
    display: inline-block;
    font-size: 1em;
    text-align: right;
    font-weight: 500;
    color: #1CAC78;
    height: 1.5em;
    padding: 0;
    caret-color: rgba(0,0,0,0.5);
    caret-shape: block;
  }

  input:focus, button:focus, textarea:focus, select:focus, [contenteditable]:focus {
    outline: none;
  }

  select:focus, input:focus {
    /* background-image: repeating-linear-gradient(145deg, #fff, #fff 3px, #ddd 3px, #ddd 6px); */
    background-color: #eee;
  }

  input:focus {
    padding-left: 0.25em !important;
    padding-right:0.25em !important;
  }

  button:focus {
    background-color: hsl(158, 72%, 29%) !important;
  }

  .testMode {
    font-size: 1.25em;
    position: static;
    x: 0;
    y: 0;
    padding-top: 0.5em;
    height: 2em;
    color: white;
    background-color: red;
    text-align: center;
  }

  #server-error h1 {
    background: red;
    color: white;
    padding: 0.6em; /* optically adjusted as the error title always begin with an “s” */
  }

  #server-error pre {
    box-sizing: border-box;
    margin-top: -1.75em;
    padding: 1em;
    width: 100%;
    white-space: pre-wrap;
    border: 4px solid red;
  }
</style>
