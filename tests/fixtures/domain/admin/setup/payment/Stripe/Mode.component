<script>
  import { onMount } from 'svelte'

  import SensitiveTextInput from '$lib/SensitiveTextInput.svelte'
  import StatusMessage from '$lib/admin/setup/StatusMessage.svelte'
  import ServiceState from '$lib/admin/setup/ServiceState.js'

  import Remote from '@small-tech/remote'

  import { loadStripe } from '@stripe/stripe-js'

  import { slide } from 'svelte/transition'

  import {
    currencyDetailsForCurrencyCode,
    zeroDecimalCurrencies
  } from '$lib/StripeCurrencies.js'

  export let model

  export let socket
  const remote = new Remote(socket)

  let state = new ServiceState()

  const keysState = new ServiceState()
  const publishableKeyState = new ServiceState()
  const secretKeyState = new ServiceState()

  const stripeObjectsState = new ServiceState()

  const priceState = new ServiceState()
  const productState = new ServiceState()
  const webhookState = new ServiceState()

  const stripeDashboardBaseUrl = `https://dashboard.stripe.com${model.id === 'test' ? `/test` : ``}`
  console.log('stripeDashboardBaseUrl', stripeDashboardBaseUrl)

  let stripe

  // Since the publishable key and the secret key may be validated
  // separately, this ties their cumulative state together.
  $: if ($publishableKeyState.is(publishableKeyState.OK) && $secretKeyState.is(secretKeyState.OK)) {
    keysState.set(keysState.OK)
  } else if ($publishableKeyState.is(publishableKeyState.NOT_OK) || $secretKeyState.is(secretKeyState.NOT_OK)) {
    keysState.set(keysState.NOT_OK)
  }

  // When the keys are valid, attempt to load the Stripe objects.
  $: if ($keysState.is(keysState.OK)) {
    console.log('Key state is OK, attempting to get Stripe objects…')
    getStripeObjects()
  }

  async function getStripeObjects() {
    console.log(`~~~ getStripeObjects for mode ${model.id} ~~~`)

    if (stripeObjectsState.is(stripeObjectsState.OK)) {
      // TODO: Ensure this doesn’t result in stale data.
      console.log('============ Already have Stripe objects. Not requesting again. =============')
      return
    }

    stripeObjectsState.set(stripeObjectsState.PROCESSING)

    try {
      const response = await remote.paymentProviders.stripe.objects.get.request.await({modeId: model.id})
      if (response.error) {
        console.error('Error getting Stripe objects', response.error)
        stripeObjectsState.set($stripeObjectsState.NOT_OK, { error: response.error })
        return
      } else {
        console.log('Got stripe objects', response)
        stripeObjectsState.set(stripeObjectsState.OK, response)
      }
    } catch (error) {
      stripeObjectsState.set(stripeObjectsState.NOT_OK, { error })
      console.log('Error in call to get Stripe objects', error)
    }
  }

  // Remote event handlers.

  remote.paymentProviders.stripe.objects.get.progress.processing.product.handler =
    () => productState.set(productState.PROCESSING)

  remote.paymentProviders.stripe.objects.get.progress.processing.price.handler =
    () => priceState.set(priceState.PROCESSING)

  remote.paymentProviders.stripe.objects.get.progress.processing.webhook.handler =
    () => webhookState.set(webhookState.PROCESSING)

  remote.paymentProviders.stripe.objects.get.progress.ok.product.handler =
    () => productState.set(productState.OK)

  remote.paymentProviders.stripe.objects.get.progress.ok.price.handler =
    () => priceState.set(priceState.OK)

  remote.paymentProviders.stripe.objects.get.progress.ok.webhook.handler =
    () => webhookState.set(webhookState.OK)

  // Note: we do not have individual error handlers since an error on one causes
  // ===== a general error that is displayed separately.

  // Validation.

  async function validateKeys () {
    keysState.set(keysState.PROCESSING)

    await validatePublishableKey()

    if (publishableKeyState.is(publishableKeyState.NOT_OK)) {
      return
    }

    await validateSecretKey()

    if (secretKeyState.is(secretKeyState.NOT_OK)) {
      return
    }
  }

  function formatStripePriceForDisplay(currencyCode, priceInStripeUnits) {
    const priceInDisplayUnits = zeroDecimalCurrencies.includes(currencyCode) ? priceInStripeUnits : priceInStripeUnits / 100

    // Format the minimum currency requirement for display to human beings.
    const currencyDetails = currencyDetailsForCurrencyCode(currencyCode)
    let formattedPrice = currencyDetails.template
    formattedPrice = formattedPrice.replace('$', currencyDetails.symbol)
    formattedPrice = formattedPrice.replace('1',priceInDisplayUnits)
    return formattedPrice
  }

  async function validatePublishableKey() {
    publishableKeyState.set(publishableKeyState.PROCESSING)

    console.log('Stripe Mode component: validate publishable key for mode:', model.id)

    // Validate the publishable key (we can only validate this client-side
    // by creating a harmless dummy call and seeing if we get an error or not).
    stripe = await loadStripe(model.publishableKey, {
      apiVersion: '2020-08-27'
    })

    const result = await stripe.createSource({
      type: 'ideal',
      amount: 1099,
      currency: 'eur',
      owner: {
        name: 'Jenny Rosen',
      },
      redirect: {
        return_url: 'https://shop.example.com/crtA6B28E1',
      },
    })

    if (result.error) {
      if (result.error.type !== 'invalid_request_error' || !result.error.message.startsWith('Invalid API Key provided')) {
        console.log('Unexpected error encountered while checking validity of publishable key:', result.error)
      }
      return publishableKeyState.set(publishableKeyState.NOT_OK)
    }

    publishableKeyState.set(publishableKeyState.OK)
  }

  async function validateSecretKey() {
    console.log('Stripe Mode component: validate secret key for mode:', model.id)

    secretKeyState.set(secretKeyState.PROCESSING)

    const response = await remote.paymentProviders.stripe.secretKey.validate.request.await({ modeId: model.id })
    console.log(`Stripe Mode component: received secret key validation response:`, response)

    secretKeyState.set(response.ok ? secretKeyState.OK : secretKeyState.NOT_OK)
  }

  async function validateSettings() {
    console.log('Stripe Mode component: validate settings for mode:', model.id)

    await validateKeys()
  }

  // Event handlers.

  onMount(async () => {
    console.log(`Stripe Mode component: settings loaded. Validating settings for mode ${model.id}`)
    validateSettings()
  })
</script>

<h4>{model.title}</h4>
<p>Your Stripe account will be automatically configured once you add your Stripe keys.</p>

<label for={`${model.id}PublishableKey`}><StatusMessage state={publishableKeyState}>Publishable key</StatusMessage></label>

<input id={`${model.id}PublishableKey`} type='text' bind:value={model.publishableKey} on:input={validatePublishableKey}/>

<label for={`${model.id}SecretKey`}><StatusMessage state={secretKeyState}>Secret key</StatusMessage></label>
<SensitiveTextInput id={`${model.id}SecretKey`} bind:value={model.secretKey} on:input={validateSecretKey}/>

{#if $keysState.is(keysState.OK)}
  <details open transition:slide>
    <summary><StatusMessage state={stripeObjectsState}>Stripe Objects</StatusMessage></summary>
      {#if $stripeObjectsState.is(stripeObjectsState.OK)}
        <p>These objects were automatically configured for you in your Stripe account.</p>

        <h3 style='font-size: 2em; margin-bottom: 0.5em;'>Product</h3>

        <img class='productImage' src={stripeObjectsState.OK.product.images[0]} alt='Product logo'/>

        <h4 style='font-size:2em; margin: 0; margin-bottom: 0.125em; padding: 0; font-weight: normal;'>{stripeObjectsState.OK.product.name}</h4>

        <p style='font-size: 1.25em; margin: 0; margin-bottom: 2em; clear: right;'>{stripeObjectsState.OK.product.description}</p>

        <p>This {stripeObjectsState.OK.product.livemode === false ? '(test)' : ''} product is {stripeObjectsState.OK.product.active ? 'active' : 'not active.'} and was created on {Date(stripeObjectsState.OK.product.created)} {stripeObjectsState.OK.product.created === stripeObjectsState.OK.product.updated ? '' : ` and last updated on ${Date(stripeObjectsState.OK.product.updated)}`}.</p>

        <p>It will appear on statements as “{stripeObjectsState.OK.product.statement_descriptor}” when purchased.</p>

        <p>Stripe will automatically calculate taxes using the <a href='https://stripe.com/docs/tax/tax-codes'>tax code</a> for {stripeObjectsState.OK.product.tax_code === 'txcd_10103000' ? 'Software as a service (SaaS)' : stripeObjectsState.OK.product.tax_code} if you have <a href='https://stripe.com/docs/tax'>Stripe Tax</a> enabled (currently invite-only).</p>

        <p style='font-size: 1.25em;'><a href='{`${stripeDashboardBaseUrl}/products/${stripeObjectsState.OK.product.id}`}'>View product in Stripe dashboard.</a></p>

        <h3 style='font-size: 2em; margin-bottom: 0;'>Price</h3>

        <p><strong>{formatStripePriceForDisplay(stripeObjectsState.OK.price.currency, stripeObjectsState.OK.price.unit_amount)}</strong> (tax {stripeObjectsState.OK.price.tax_behavior}) {stripeObjectsState.OK.price.type}
          {
            stripeObjectsState.OK.price.type === 'recurring' ?
              `(every ${stripeObjectsState.OK.price.recurring.interval_count === 1 ? '' :
                stripeObjectsState.OK.price.recurring.interval_count} ${stripeObjectsState.OK.price.recurring.interval}${stripeObjectsState.OK.price.recurring.interval_count === 1 ? '' : 's'})`
            : ''
          }.</p>

        <p style='font-size: 1.25em;'><a href='{`${stripeDashboardBaseUrl}/prices/${stripeObjectsState.OK.price.id}`}'>View the price in your Stripe dashboard.</a></p>

        <h3 style='font-size: 2em; margin-bottom: 0;'>Webhook</h3>

        <p>Stripe will call <strong>{stripeObjectsState.OK.webhook.url}</strong> on the following events:</p>

        <ul>
          {#each stripeObjectsState.OK.webhook.enabled_events as event}
            <li>{event.replace(/\./g, ' ')}</li>
          {/each}
        </ul>

        <p style='font-size: 1.25em;'><a href='{`${stripeDashboardBaseUrl}/webhooks/${stripeObjectsState.OK.webhook.id}`}'>View the webhook in your Stripe dashboard.</a></p>

      {/if}

      {#if $stripeObjectsState.is(stripeObjectsState.NOT_OK)}
        <h3 style='color: red;'>Error: {stripeObjectsState.NOT_OK.error.raw.message}</h3>
        <p>Could not create your Stripe objects.</p>
        <ul>
          <li><strong>Error type:</strong> {stripeObjectsState.NOT_OK.error.raw.type.replace(/_/g, ' ')}</li>
          <li><strong>Error code:</strong> <a href='{stripeObjectsState.NOT_OK.error.doc_url}'>{stripeObjectsState.NOT_OK.error.raw.code.replace(/_/g, ' ')}</a></li>
          {#if stripeObjectsState.NOT_OK.error.raw.param}
            <li><strong>Affected parameter:</strong> {stripeObjectsState.NOT_OK.error.raw.param}</li>
          {/if}
          <li><strong>Status code:</strong> {stripeObjectsState.NOT_OK.error.raw.statusCode}</li>
          <li><strong>Request ID:</strong> {stripeObjectsState.NOT_OK.error.raw.requestId}</li>
        </ul>
      {/if}

      {#if $stripeObjectsState.is(stripeObjectsState.PROCESSING)}
        <p>Your Stripe objects are being created…</p>

        <ul class='serverCreationProgress'>
          <li><StatusMessage state={productState}>Product</StatusMessage></li>
          <li><StatusMessage state={priceState}>Price</StatusMessage></li>
          <li><StatusMessage state={webhookState}>Webhook</StatusMessage></li>
        </ul>
      {/if}
  </details>
{/if}

<style>
  summary {
    font-size: 1.5em;
    border-bottom: 2px dashed grey;
    padding-bottom:0.5em;
  }

  details {
    padding-bottom: 0.75em;
  }

  details[open], details[open] summary {
    border-bottom: 2px solid grey;
  }

  ul.serverCreationProgress {
    list-style-type: none;
    font-size: 1.5em;
    line-height: 1.5;
    margin: 0;
  }

  .productImage {
    width: 5em;
    /* border: 1px solid grey; */
    padding: 0.5em;
    float: left;
    margin-right: 2em;
  }
</style>
