//////////////////////////////////////////////////////////////////////////////////////////
//
// Helper methods for dealing with supported Stripe currencies, based on the
// information available on https://stripe.com/docs/currencies#presentment-currencies
//
// Copyright ⓒ 2021-present Aral Balkan.
// Shared with ♥ by the Small Technology Foundation.
//
// Like this? Fund us!
// https://small-tech.org/fund-us
//
//////////////////////////////////////////////////////////////////////////////////////////

import currencyFormat from 'currency-format'

// All API requests expect amounts to be provided in a currency’s smallest unit.
// For example, to charge 10 USD, provide an amount value of 1000 (i.e., 1000 cents).
//
// For zero-decimal currencies, still provide amounts as an integer but without
// multiplying by 100. For example, to charge ¥500, provide an amount value of 500.
//
// (https://stripe.com/docs/currencies#zero-decimal)
export const zeroDecimalCurrencies = [ 'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf' ]

// Map of settlement currencies
// (https://stripe.com/docs/payouts#supported-accounts-and-settlement-currencies)
// to minimum charge amounts.
// (https://stripe.com/docs/currencies#minimum-and-maximum-charge-amounts)
export const minimumChargeAmountsInCurrencyUnits = {
  usd: 0.50,
  aed: 2.00,
  aud: 0.50,
  bgn: 1.00,
  brl: 0.50,
  cad: 0.50,
  chf: 0.50,
  czk: 15.00,
  dkk: 2.50,
  eur: 0.50,
  gbp: 0.30,
  hkd: 4.00,
  huf: 175.00,
  inr: 0.50,
  jpy: 50,
  mxn: 10,
  myr: 2,
  nok: 3.00,
  nzd: 0.50,
  pln: 2.00,
  ron: 2.00,
  sek: 3.00,
  sgd: 0.50
}

// Calculate the minimum charge amounts in Stripe’s currency units (which are
// the unit in the currency for zero-decimal currencies and the unit in currency
// multiplied by 100 for all others).
export const minimumChargeAmountsInStripeUnits = {}
for (let currency in minimumChargeAmountsInCurrencyUnits) {
  minimumChargeAmountsInStripeUnits[currency] = minimumChargeAmountsInCurrencyUnits[currency] * (zeroDecimalCurrencies.includes(currency) ? 1 : 100)
}

// Minimum charge amounts in whole currency units (rounded up to the next whole number).
export const minimumChargeAmountsInWholeCurrencyUnits = {}
for (let currency in minimumChargeAmountsInCurrencyUnits) {
  minimumChargeAmountsInWholeCurrencyUnits[currency] = Math.ceil(minimumChargeAmountsInCurrencyUnits[currency])
}

// Minimum charge amounts in whole Stripe units.
export const minimumChargeAmountsInWholeStripeUnits = {}
for (let currency in minimumChargeAmountsInCurrencyUnits) {
  minimumChargeAmountsInWholeStripeUnits[currency] = minimumChargeAmountsInWholeCurrencyUnits[currency] * (zeroDecimalCurrencies.includes(currency) ? 1 : 100)
}

// Scraped and collated from https://stripe.com/docs/currencies
// on Tuesday, June 7, 2021.

export const standard135Currencies = ['usd','aed','afn','all','amd','ang','aoa','ars','aud','awg','azn','bam','bbd','bdt','bgn','bif','bmd','bnd','bob','brl','bsd','bwp','bzd','cad','cdf','chf','clp','cny','cop','crc','cve','czk','djf','dkk','dop','dzd','egp','etb','eur','fjd','fkp','gbp','gel','gip','gmd','gnf','gtq','gyd','hkd','hnl','hrk','htg','huf','idr','ils','inr','isk','jmd','jpy','kes','kgs','khr','kmf','krw','kyd','kzt','lak','lbp','lkr','lrd','lsl','mad','mdl','mga','mkd','mmk','mnt','mop','mro','mur','mvr','mwk','mxn','myr','mzn','nad','ngn','nio','nok','npr','nzd','pab','pen','pgk','php','pkr','pln','pyg','qar','ron','rsd','rub','rwf','sar','sbd','scr','sek','sgd','shp','sll','sos','srd','std','szl','thb','tjs','top','try','ttd','twd','tzs','uah','ugx','uyu','uzs','vnd','vuv','wst','xaf','xcd','xof','xpf','yer','zar','zmw']

export const additionalCurrenciesSupportedInUnitedArabEmirates = [ "bhd", "jod", "kwd", "omr", "tnd" ]

export const allSupportedCurrencies = standard135Currencies.concat(additionalCurrenciesSupportedInUnitedArabEmirates).sort()

export function currencyDetailsForCurrencyCode (currencyCode) {
  const currency = currencyFormat[currencyCode.toUpperCase()]
  const currencySymbol = currency.uniqSymbol === null ? currency.symbol : currency.uniqSymbol
  return {
    name: currency.name,
    symbol: currencySymbol.grapheme,
    label: `${currency.name} (${currencySymbol.grapheme})`,
    template: currencySymbol.template
  }
}

export const currencyDetails = {}
allSupportedCurrencies.forEach(currencyCode => currencyDetails[currencyCode] = currencyDetailsForCurrencyCode(currencyCode))

export const currencyLabels = allSupportedCurrencies.map(currencyCode => currencyDetailsForCurrencyCode(currencyCode).label)

export const currencyLabelsToCurrencyCodes = {}
allSupportedCurrencies.forEach(currencyCode => {
  const currency = currencyDetailsForCurrencyCode(currencyCode)
  currencyLabelsToCurrencyCodes[currency.label] = currencyCode
})

export const alphabeticallySortedCurrencyLabels = currencyLabels.sort()

export const alphabeticallySortedCurrencyDetails = alphabeticallySortedCurrencyLabels.map(currencyLabel => {
  const code = currencyLabelsToCurrencyCodes[currencyLabel]
  return {
    code,
    label: currencyLabel,
    template: currencyDetailsForCurrencyCode(code).template
  }
})

// From the drop-down list available at https://stripe.com/docs/currencies
export const supportedCountries = ['au','at','be','br','bg','ca','cy','cz','dk','ee','fi','fr','de','gr','hk','hu','in','ie','it','jp','lv','lt','lu','my','mt','mx','nl','nz','no','pl','pt','ro','sg','sk','si','es','se','ch','ae','gb','us']

export const mapOfCountriesToSupportedPresentmentCurrencies = {}
supportedCountries.forEach(countryCode => {
  mapOfCountriesToSupportedPresentmentCurrencies[countryCode] = standard135Currencies
  // The United Arab Emirates is the exception, apparently, as five additional
  // currencies are supported.
  if (countryCode === 'ae') {
    mapOfCountriesToSupportedPresentmentCurrencies[countryCode] = additionalCurrenciesSupportedInUnitedArabEmirates.concat(standard135Currencies)
  }
})
