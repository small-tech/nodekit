const fetch = require('node-fetch')

module.exports = async (request, response) => {

  const domain = request.params.domain

  try {
    await fetch(`https://${domain}.small-web.org`)
  } catch (error) {
    response.json(false)
  }

  response.json(true)
}
