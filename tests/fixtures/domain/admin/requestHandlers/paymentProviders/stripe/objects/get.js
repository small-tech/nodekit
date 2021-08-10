// Returns the Stripe objects (price, product, and webhook).
// If they do not exist, they are created and returned.
// If they do not exist and they cannot be created, or if there is any other error,
// an error is returned.

const stripeWithSecretKey = require('stripe')
const validateDns = require('../../../../validate-dns.cjs')

module.exports = async (remote, message) => {
  console.log('[Stripe: getObjects] Called.')
  const mode = message.modeId
  const stripeDetails = db.settings.payment.providers[2].modeDetails[mode === 'live' ? 1 : 0]

  const stripe = stripeWithSecretKey(stripeDetails.secretKey, {
    apiVersion: '2020-08-27'
  })

  let product = null
  let price = null
  let webhook = null

  // Before we can create Stripe objects, the DNS settings and domain
  // must be valid. TODO: implementing this check here so that we’re thorough,
  // but the client should detect this state and inform the person and
  // not allow things to progress to this point.
  try {
    console.log('Confirming that DNS settings are correct before proceeding…')
    await validateDns()
  } catch (error) {
    console.log('DNS settings are not correct. Aborting with error.', error)
    remote.paymentProviders.stripe.objects.get.request.respond(message, { error })
    return
  }

  console.log('[Stripe: getObjects] DNS settings are correct.')

  const domain = db.settings.dns.domain
  const webhookUrl = `https://${domain}/stripe`

  // If the Stripe object IDs do not exist in the database, then
  // either they have not been created in Stripe or this installation
  // of Domain doesn’t know about them for some reason. Attempt to create them.

  if (stripeDetails.productId === '') {
    // Product does not exist. Attempt to create it.
    console.log('[Stripe: getObjects] Product does not exist. Attempting to create it…')
    remote.paymentProviders.stripe.objects.get.progress.processing.product.send({ mode })
    try {
      product = await createProduct(domain, stripe)
    } catch (error) {
      console.log('[Stripe: getObjects] Error: product creation failed', error)
      return remote.paymentProviders.stripe.objects.get.request.respond(message, { error })
    }
    console.log('[Stripe: getObjects] Product creation succeeded. Product id:', product.id)
    stripeDetails.productId = product.id
    remote.paymentProviders.stripe.objects.get.progress.ok.product.send({ mode })
  }

  if (stripeDetails.priceId === '') {
    // Price does not exist. Attempt to create it.
    console.log('[Stripe: getObjects] Price does not exist. Attempting to create it…')
    remote.paymentProviders.stripe.objects.get.progress.processing.price.send({ mode })
    try {
      price = await createPrice(domain, stripe)
    } catch (error) {
      console.log('[Stripe: getObjects] Error: price creation failed', error)
      return remote.paymentProviders.stripe.objects.get.request.respond(message, { error })
    }
    console.log('[Stripe: getObjects] Price creation succeeded. Price id:', price.id)
    stripeDetails.priceId = price.id
    remote.paymentProviders.stripe.objects.get.progress.ok.price.send({ mode })
  }

  if (stripeDetails.webhookId === '') {
    // Webhook does not exist. Attempt to create it.
    console.log('[Stripe: getObjects] Webhook does not exist. Attempting to create it…')
    remote.paymentProviders.stripe.objects.get.progress.processing.webhook.send({ mode })
    try {
      webhook = await createWebhook(domain, webhookUrl, stripe)
    } catch (error) {
      console.log('[Stripe: getObjects] Error: Webhook creation failed', error)
      return remote.paymentProviders.stripe.objects.get.request.respond(message, { error })
    }
    console.log('[Stripe: getObjects] Webhook creation succeeded. Webhook id:', webhook.id)
    stripeDetails.webhookId = webhook.id
    remote.paymentProviders.stripe.objects.get.progress.ok.webhook.send({ mode })
  }

  // At this point, the Stripe object IDs should exist in the database
  // and the objects themselves might even be populated if we
  // just created them. If not, we will retrieve them now.

  if (product === null) {
    console.log('[Stripe: getObjects] Product not loaded. Attempting to load. Id: ', stripeDetails.productId)
    remote.paymentProviders.stripe.objects.get.progress.processing.product.send({ mode })
    try {
      product = await stripe.products.retrieve(stripeDetails.productId)
    } catch (error) {
      // TODO: analyse error.
      console.log('[Stripe: getObjects] Error (recoverable) while retrieving product. Attempting to create product…', error)
      // Product does not exist. Attempt to create it.
      try {
        product = await createProduct(domain, stripe)
      } catch (error) {
        console.log('[Stripe: getObjects] Error (unrecoverable) while creating product.', error)
        return remote.paymentProviders.stripe.objects.get.request.respond(message, { error })
      }
      console.log('[Stripe: getObjects] Product created. Product id:', product.id)
    }
    console.log('[Stripe: getObjects] Product loaded. Product id:', product.id)
    remote.paymentProviders.stripe.objects.get.progress.ok.product.send({ mode })
  }

  if (price === null) {
    console.log('[Stripe: getObjects] Price not loaded. Attempting to load. Id: ', stripeDetails.priceId)
    remote.paymentProviders.stripe.objects.get.progress.processing.price.send({ mode })
    try {
      price = await stripe.prices.retrieve(stripeDetails.priceId)
    } catch (error) {
      // TODO: analyse error.
      console.log('[Stripe: getObjects] Error (recoverable) while retrieving price. Attempting to create price…', error)
      try {
        price = await createPrice(domain, stripe)
      } catch (error) {
        console.log('[Stripe: getObjects] Error (unrecoverable) while creating price.', error)
        return remote.paymentProviders.stripe.objects.get.request.respond(message, { error })
      }
      console.log('[Stripe: getObjects] Price created. Price id:', price.id)
    }
    console.log('[Stripe: getObjects] Price loaded. Price id:', product.id)
    remote.paymentProviders.stripe.objects.get.progress.ok.price.send({ mode })
  }

  if (webhook === null) {
    console.log('[Stripe: getObjects] Webhook not loaded. Attempting to load. Id: ', stripeDetails.webhookId)
    remote.paymentProviders.stripe.objects.get.progress.processing.webhook.send({ mode })
    try {
      webhook = await stripe.webhookEndpoints.retrieve(stripeDetails.webhookId)
    } catch (error) {
      // TODO: analyse error.
      console.log('[Stripe: getObjects] Error (recoverable) while retrieving webhook. Attempting to create webhook…', error)
      try {
        webhook = await createWebhook(domain, webhookUrl, stripe)
      } catch (error) {
        console.log('[Stripe: getObjects] Error (unrecoverable) while creating webhook.', error)
        remote.paymentProviders.stripe.objects.get.request.respond(message, { error })
      }
      console.log('[Stripe: getObjects] Webhook created. Webhook id:', webhook.id)
    }
    console.log('[Stripe: getObjects] Webhook loaded. Webhook id:', webhook.id)
    remote.paymentProviders.stripe.objects.get.progress.ok.webhook.send({ mode })
  }

  // OK, if we made it here, all should be good and we have the Stripe objects to return.
  console.log('[Stripe: getObjects] All good. Returning Stripe objects.')
  remote.paymentProviders.stripe.objects.get.request.respond(message, { product, price, webhook })
}

function productIdFromDomain(domain) {
  return `prod_small_web_domain_${domain.replace(/\./g, '_')}`
}

// Attempt to create product (may throw).
async function createProduct(domain, stripe) {
  console.log(`createProduct(${domain}, ${stripe})`)
  const productDetails = {
    // Note: product ids must not have dots in them.
    // Must match pattern: (/\A[a-zA-Z0-9_\-]+\z/)
    id: productIdFromDomain(domain),
    name: `${domain} (monthly)`,
    description: 'Monthly fee for your Small Web place',
    statement_descriptor: domain,
    tax_code: 'txcd_10103000', // Software as a Service
    images: ['https://small-web.org/small-web.svg'],
    url: `https://${domain}`
  }

  console.log('Creating product…', productDetails)

  return await stripe.products.create(productDetails)
}


// Attempt to create price (may throw).
async function createPrice(domain, stripe) {
  console.log(`createPrice(${domain}, ${stripe})`)

  const stripeDetails = db.settings.payment.providers[2]

  const priceDetails = {
    currency: stripeDetails.currency,

    // TODO: Ensure this is in Stripe units.
    unit_amount: stripeDetails.price,
    product: productIdFromDomain(domain),
    nickname: `Price for ${domain} (monthly)`,
    recurring: {
      interval: 'month'
    },
    tax_behavior: 'inclusive'
  }

  console.log('Creating price…', priceDetails)

  return await stripe.prices.create(priceDetails)
}


// Attempt to create webhook (may throw).
async function createWebhook(domain, webhookUrl, stripe) {
  console.log(`createWebhook(${domain}, ${webhookUrl}, ${stripe})`)
  return await stripe.webhookEndpoints.create({
    url: webhookUrl,
    description: `Webhooks for Small Web domain ${domain}`,
    enabled_events: [
      'customer.subscription.created',
      'customer.subscription.deleted',
      'customer.subscription.updated'
    ]
  })
}
