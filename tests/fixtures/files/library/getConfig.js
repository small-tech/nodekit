export function getConfig () {
  const defaultConfig = {
    payment: {},
    dns: {},
    org: {}
  }

  let config
  if (db.settings === undefined) {
    settings = defaultConfig
  } else {
    config = {
      payment: {
        provider: db.settings.payment.provider
      },
      dns: {
        domain: db.settings.dns.domain
      },
      org: db.settings.org
    }
  }

  if (settings.payment.provider === 2 /* Stripe */) {
    const stripe = db.settings.payment.providers[2]
    config.payment.mode = stripe.mode,
    config.payment.currency = stripe.currency,
    config.payment.price = stripe.price
  }

  return config
}
