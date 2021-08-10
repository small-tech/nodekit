////////////////////////////////////////////////////////////////////////////////
//
// Small-Web.org Basil API
//
// /domain/available/:domain
//
// Returns {domain, available: true|false}
//
// Client errors (400):
//
//   1. Requested hostname contains invalid characters. (RFC 3696)
//
// Copyright ⓒ 2020-present Aral Balkan. Licensed under AGPLv3.
// Shared with ♥ by the Small Technology Foundation.
//
// Like this? Fund us!
// https://small-tech.org/fund-us
//
////////////////////////////////////////////////////////////////////////////////

if (!db.domains) {
  db.domains =  []
}

function error (response, statusCode, errorCode, message) {
  response.statusCode = statusCode
  response.json({ code: errorCode, message })
}

module.exports = async (request, response) => {
  const domain = request.params.domain

  // Disallow queries comprised solely of whitespace.
  if (domain.trim() === '') {
    return error(response, 400, 1, 'Hostname cannot be empty. (RFC 3696)')
  }

  // Via https://github.com/miguelmota/is-valid-hostname/blob/a375657352475b03fbd118e3b46029aca952d816/index.js#L5 implementation of RFC 3696. (With removal of dots for our purposes as we are validating a subdomain.)
  const validHostnameCharacters = /^([a-zA-Z0-9-]+){1,253}$/g

  if (!validHostnameCharacters.test(domain)) {
    return error(response, 400, 2, 'Requested hostname contains invalid characters. (RFC 3696)')
  }

  const available = (db.domains[domain] === undefined)
  response.json({domain, available})
}
