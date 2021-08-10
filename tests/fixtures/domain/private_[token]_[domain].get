const nacl = require('tweetnacl')
const sealedBox = require('tweetnacl-sealedbox-js')

function getPublicEncryptionKeyForDomain(domain) {
  const domainRecord = db.domains[domain]
  if (domainRecord === undefined) return undefined
  return domainRecord.publicKeys.encryption
}

module.exports = (request, response) => {
  const domain = request.params.domain
  const publicEncryptionKeyForDomain = getPublicEncryptionKeyForDomain(domain)

  if (publicEncryptionKeyForDomain === undefined) {
    // Error: This domain does not exist.
    console.warn(`⚠️ Cannot get public key for domain ${domain}. Domain not found.`)
    response.json({
      error: 'Domain not found.'
    })
    return
  }

  console.log('public encryption key for domain: ', publicEncryptionKeyForDomain)

  const publicEncryptionKey = Buffer.from(publicEncryptionKeyForDomain, 'hex')

  // Generate a new private token.
  // (The hexadecimal representation of a 32-byte cryptographically random buffer.)
  const randomBytes = nacl.randomBytes(32)
  const unencryptedPrivateToken = toHex(randomBytes)

  // Save the private token.
  if (!db.privateTokens) {
    db.privateTokens = []
  }
  db.privateTokens.push({ domain, createdAt: Date.now(), accessedAt: Date.now(), body: unencryptedPrivateToken })

  // Encrypt the private token using the domain’s public encryption key.
  // Remember that the purpose of this token is for the person to prove who they are so the server
  // will permit them to connect to its private routes. They will do so by unencrypting the token
  // and initiating a stateful WebSocket connection using it within a short period of time (see above).
  // Since client/server communication takes place over a TLS connection, the server doesn’t need to
  // prove its identity again so a sealed box will suffice.
  const encryptedPrivateToken = toHex(sealedBox.seal(Buffer.from(unencryptedPrivateToken), publicEncryptionKey))

  console.log(`   🔑️    ❨Domain❩ Created new private token: ${unencryptedPrivateToken.slice(0,8).toLowerCase()}`)

  response.json({
    encryptedPrivateToken
  })
}

//
// Private.
//

// Check every minute and prune private tokens that haven’t been used within the last ten seconds.
// (This means the validity of a private token is between 10-60 seconds.)
setInterval(() => {
  const now = Date.now()
  try { db } catch (error) { return } // In case global db hasn’t been created yet.
  if (!db.privateTokens) { return }   // In case privateTokens table hasn’t been created yet.
  db.privateTokens.forEach((privateToken, index) => {
    if (privateToken.createdAt === privateToken.accessedAt && (now - privateToken.createdAt > 10000)) {
      db.privateTokens.splice(index, 1)
    }
  })
}, 1 /* minute */ * 60 * 1000)

// Uint8Array to Hex String
// Author: Michael Fabian 'Xaymar' Dirks
// https://blog.xaymar.com/2020/12/08/fastest-uint8array-to-hex-string-conversion-in-javascript/

// Pre-Init
const LUT_HEX_4b = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F']
const LUT_HEX_8b = new Array(0x100)
for (let n = 0; n < 0x100; n++) {
  LUT_HEX_8b[n] = `${LUT_HEX_4b[(n >>> 4) & 0xF]}${LUT_HEX_4b[n & 0xF]}`
}

// End Pre-Init
function toHex(buffer) {
  let out = ''
  for (let idx = 0, edx = buffer.length; idx < edx; idx++) {
    out += LUT_HEX_8b[buffer[idx]]
  }
  return out.toLowerCase()
}

// Hex string to Uint8Array
function hexToUInt8Array(string) {
  string = string.toUpperCase()
  var bytes = new Uint8Array(Math.ceil(string.length / 2));
  for (var i = 0; i < bytes.length; i++) bytes[i] = parseInt(string.substr(i * 2, 2), 16);
  return bytes
}
