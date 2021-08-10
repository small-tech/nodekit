// Validate Stripe secret key by sending a side-effect free balance request
// using the Stripe API.

// Create a new price.
const stripeWithSecretKey = require('stripe')

module.exports = async (remote, message) => {
  const stripeDetails = db.settings.payment.providers[2].modeDetails[message.modeId === 'live' ? 1 : 0]

  const stripe = stripeWithSecretKey(stripeDetails.secretKey, {
    apiVersion: '2020-08-27'
  })

  let balance
  try {
    balance = await stripe.balance.retrieve()
  } catch (error) {
    return remote.paymentProviders.stripe.secretKey.validate.request.respond(message, { ok: false, modeId: message.modeId, error })
  }

  remote.paymentProviders.stripe.secretKey.validate.request.respond(message, { ok: true, modeId: message.modeId })
}
