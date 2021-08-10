<script>
  import { onMount } from 'svelte'

  import Remote from '@small-tech/remote'
  import Switch from 'svelte-switch'

  import { TabbedInterface, TabList, Tab, TabPanel } from '$lib/TabbedInterface'
  import ServiceState from '$lib/admin/setup/ServiceState.js'
  import validateDns from '$lib/admin/setup/validateDns.js'

  import StatusMessage from '$lib/admin/setup/StatusMessage.svelte'

  import StripeMode from './Mode.svelte'

  import {
    alphabeticallySortedCurrencyDetails,
    additionalCurrenciesSupportedInUnitedArabEmirates,
    currencyDetailsForCurrencyCode,
    minimumChargeAmountsInWholeCurrencyUnits,
    zeroDecimalCurrencies
  } from '$lib/StripeCurrencies.js'

  export let settings
  export let model
  export let active

  export let socket
  const remote = new Remote(socket)

  export let state = new ServiceState()

  const dnsState = new ServiceState()

  const stripeModeStates = {
    test: new ServiceState(),
    live: new ServiceState()
  }

  // Convert the price from Stripe units based on whether it is in
  // a zero-decimal currency or not. For more details, see:
  // https://stripe.com/docs/currencies#zero-decimal
  let price = zeroDecimalCurrencies.includes(model.currency) ? model.price : model.price / 100
  let previousPrice = price

  // See https://stripe.com/docs/currencies#minimum-and-maximum-charge-amounts
  let minimumPriceForCurrency
  let formattedMinimumPriceForCurrency

  let stripeCurrencyOnlyValidInUnitedArabEmirates = false

  $: stripeCurrencyOnlyValidInUnitedArabEmirates = additionalCurrenciesSupportedInUnitedArabEmirates.includes(model.currency)
  $: minimumPriceForCurrency = minimumChargeAmountsInWholeCurrencyUnits[model.currency] === undefined ? 1 : minimumChargeAmountsInWholeCurrencyUnits[model.currency]
  $: {
      const currencyDetails = currencyDetailsForCurrencyCode(model.currency)
      let output = currencyDetails.template
      output = output.replace('$', currencyDetails.symbol)
      output = output.replace('1', minimumPriceForCurrency)
      formattedMinimumPriceForCurrency = output
  }

  // Domain and DNS settings must be configured correctly before you can
  // set up Stripe. Check every time the view becomes active.
  // TODO: We need a way to implement two-way communication between sections
  // ===== as hitting the server on every show isn’t really a great experience.

  $: if (active) {
    dnsState.set(dnsState.PROCESSING)
    validateDns(dnsState, settings, remote)
  }

  function handleCurrencyChange() {
    // If Stripe has specified a minimum price for a currency, use that.
    // If not, we default to 1. (TODO: Talk to Stripe about what to do about this
    // for currencies not included in the table at
    // https://stripe.com/docs/currencies#minimum-and-maximum-charge-amounts)
    minimumPriceForCurrency = minimumChargeAmountsInWholeCurrencyUnits[model.currency] === undefined ? 1 : minimumChargeAmountsInWholeCurrencyUnits[model.currency]

    // Format the minimum currency requirement for display to human beings.
    const currencyDetails = currencyDetailsForCurrencyCode(model.currency)
      let output = currencyDetails.template
      output = output.replace('$', currencyDetails.symbol)
      output = output.replace('1', minimumPriceForCurrency)
      formattedMinimumPriceForCurrency = output

    // Check if the price that’s set meets the minimum price requirement
    // and fix and persist it if it doesn’t.
    if (price < minimumPriceForCurrency) {
      price = minimumPriceForCurrency
      validatePrice()
    }
  }

  function validatePrice() {
    // Ensure the price is always valid (an integer and > the minimum allowed for the currency).
    price = price === null ? previousPrice : price < minimumPriceForCurrency ? minimumPriceForCurrency : parseInt(price)

    if (price === previousPrice) {
      return
    }

    previousPrice = price

    // Save the price in Stripe units based on whether it is in
    // a zero-decimal currency or not. For more details, see:
    // https://stripe.com/docs/currencies#zero-decimal
    model.price = zeroDecimalCurrencies.includes(model.currency) ? price : price * 100
  }
</script>

{#if $dnsState.is(dnsState.UNKNOWN) || dnsState.is(dnsState.PROCESSING)}
  <StatusMessage state={dnsState}>Loading…</StatusMessage>
{/if}

{#if $dnsState.is(dnsState.NOT_OK)}
  <h3>Please fix your DNS settings first.</h3>
  <p>A number of Stripe configuration options depend on your domain name and DNS settings being correct.</p>
{/if}

{#if $dnsState.is(dnsState.OK)}
  <section class='instructions'>
    <h4>Instructions</h4>

    <ol>
      <li>Get a <a href='https://stripe.com'>Stripe</a> account.</li>
      <li>Accept your <a href='https://stripe.com/dpa/legal'>Data Processing Addendum</a> (GDPR). Download and print a copy, sign it and keep it safe.</li>
      <li>From your <a href='https://dashboard.stripe.com/dashboard'>Stripe dashboard</a>, get your <em>test API keys</em> and your live API keys and enter them below.</li>
      <li>Set the price and currency to finish your Stripe configuration and create your monthly subscription. Please also read through the <a href='https://stripe.com/docs/currencies'>supported currencies</a> section of the Stripe documentation.</li>
    </ol>

    <p><em></em></p>
  </section>

  <h5>Subscription</h5>

  <p>Please note that you can only have one plan, only set prices in whole numbers (no “psychological pricing”), and only support one currency (ideally, the one for the local region that your Small Web Domain is based in). These limitations are not bugs, they are features to encourage a Small Web. <a href='#payment-notes'>Learn more.</a></p>

  <label for='currency'>Currency</label>

  <select id='currency' bind:value={model.currency} on:change={handleCurrencyChange}>
    {#each alphabeticallySortedCurrencyDetails as currency, index}
      <option value={currency.code} selected={currency.code === 'eur'}>{currency.label}</option>
    {/each}
  </select>

  {#if stripeCurrencyOnlyValidInUnitedArabEmirates}
    <p><small><strong>* This currency is only supported if your organisation is set to United Arab Emirates in Stripe.</strong> For more information, please see the <a href='https://stripe.com/docs/currencies'>supported currencies</a> section of the Stripe documentation.</small></p>
  {/if}

  <label for='price'>Price/month <small>(<a href='https://stripe.com/docs/currencies#minimum-and-maximum-charge-amounts'>Minimum:</a> {formattedMinimumPriceForCurrency})</small></label>
  <input id='price' type='number' bind:value={price} on:input={validatePrice} step='1' min='{minimumPriceForCurrency}' autocomplete='off'/>

  <label for='mode'>Mode</label>
  <Switch id='mode' on:change={event => settings.payment.providers[2].mode = event.detail.checked ? 'live' : 'test'} checked={settings.payment.providers[2].mode === 'live'} handleDiameter='' width=75>
    <span class='live' slot='checkedIcon'>Live</span>
    <span class='test' slot='unCheckedIcon'>Test</span>
  </Switch>

  <TabbedInterface navStyle={true}>
    <TabList navStyle={true}>
      {#each settings.payment.providers[2].modeDetails as mode}
        <Tab navStyle={true}>{mode.title}</Tab>
      {/each}
    </TabList>
    {#each settings.payment.providers[2].modeDetails as mode}
      <TabPanel>
        <StripeMode {socket} {settings} model={mode} bind:state={stripeModeStates[mode.id]}/>
      </TabPanel>
    {/each}
  </TabbedInterface>

  <section id='payment-notes'>
    <h5>A note on commerical payment support.</h5>

    <p>When taking commercial payments for your Small Web Domain via Stripe, you can only have one plan, only set prices in whole numbers (no “psychological pricing”), and only support one currency (ideally, the one for the local region that your Small Web Domain is based in). These limitations are not bugs, they are features to encourage a Small Web.</p>

    <p>The idea is that no single Small Web Domain should scale beyond a certain point. Your Small Web Domain should be serving your community and you should let other Small Web Domains serve theirs. This is our <a href='https://small-web.org/about/#small-technology'>non-colonial approach</a> as per the <a href='https://small-web.org/about/#small-technology'>Small Technology Principles</a>.</p>

    <p>Support for a commercial option is necessary for organisations that have to exist under capitalism. It doesn’t mean we have to play their shortsighted manipulative games or adopt their success criteria. The goal is for our organisations to provide a bridge to a post-capitalist future (e.g., on where cities can use tokens to provide their citizens with access to the commons from the commons).</p>

    <p>You will not become rich by running a Small Web Domain. If that’s your goal, please look elsewhere. However, you will hopefully be able to susbist under capitalism while helping bootstrap a kinder, fairer, and more caring world based on respect for human rights and democracy.</p>

    <p><strong>If you are making money with your Small Web Domain, please consider sharing a percentage of your earnings with <a href='https://small-tech.org/'>Small Technology Foundation</a> by <a href='https://small-tech.org/fund-us'>becoming a patron</a> so we can continue to develop the software you use to run yours.</strong></p>
  </section>
{/if}

<style>
  #paymentProvider {
    min-width: 300px;
  }

  :global(label[for=mode] + div) {
    margin-bottom: 1em;
  }

  label[for=mode] {
    display: block;
    margin-bottom: 0;
  }

  .live, .test {
		color: white;
		display: inline-block;
		margin-top: 0.1em;
	}
  .test {
    margin-right: 0.75em;
  }

	.live {
		margin-left: 0.75em;
	}
</style>
