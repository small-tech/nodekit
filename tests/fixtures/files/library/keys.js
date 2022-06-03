import session25519 from 'session25519'
import blake from 'blakejs'
import nacl from 'tweetnacl'
import naclUtil from 'tweetnacl-util'
import sealedBox from 'tweetnacl-sealedbox-js'
import { compute_rest_props } from 'svelte/internal'

// Add sealed box functionality to TweetNaCl.
nacl.sealedBox = sealedBox

// Return all keys (secret and public signing and encryption keys.)
export async function getKeys (domain, passphrase) {
  const blake2bHashOfHostnameAsSalt = blake.blake2bHex(domain)
  const keys = await generateKeys(blake2bHashOfHostnameAsSalt, passphrase)
  return {
    public: {
      signing: keys.publicSignKey,
      encryption: keys.publicKey
    },
    secret: {
      signing: keys.secretSignKey,
      encryption: keys.secretKey
    }
  }
}

export async function getPublicKeys (domain, passphrase) {
  const keys = await getKeys(domain, passphrase)
  return keys.public
}

export async function getSecretKeys (domain, passphrase) {
  const keys = await getKeys(domain, passphrase)
  return keys.secret
}

export async function getKeysHex (domain, passphrase) {
  const keys = await getKeys(domain, passphrase)
  return {
    public: {
      signing: toHex(keys.public.signing),
      encryption: toHex(keys.public.encryption)
    },
    secret: {
      signing: toHex(keys.secret.signing),
      encryption: toHex(keys.secret.encryption)
    }
  }
}

export async function getPublicKeysHex (domain, passphrase) {
  const keys = await getKeysHex(domain, passphrase)
  return keys.public
}

export async function getSecretKeysHex (domain, passphrase) {
  const keys = await getKeysHex(domain, passphrase)
  return keys.secret
}

export async function authenticate (domain, passphrase) {
  // Get the encrypted private token.
  const privateTokenURL = `https://${window.location.hostname}/private-token/${domain}`

  const privateTokenResponse = await fetch(privateTokenURL)
  console.log(privateTokenResponse)
  const privateTokenResponseJson = await privateTokenResponse.json()
  console.log(privateTokenResponseJson)
  const encryptedPrivateToken = privateTokenResponseJson.encryptedPrivateToken

  const keys = await getKeys(domain, passphrase)

  const keysAsHex = await getKeysHex(domain, passphrase)


  const publicEncryptionKeyAsHex = toHex(keys.public.encryption)
  console.log('Public encryption key: ', publicEncryptionKeyAsHex)

  // Open the sealed box to get the token.
  console.log('keys', keys)
  console.log('keysAsHex', keysAsHex)
  console.log('encryptedPrivateToken', encryptedPrivateToken)
  const sealedBoxOpenResult = nacl.sealedBox.open(hexToUInt8Array(encryptedPrivateToken), keys.public.encryption, keys.secret.encryption)

  if (sealedBoxOpenResult === null) {
    console.log('Error: could not decrypt the private token.')
    return null
  }

  // OK, signed in.
  const privateToken = naclUtil.encodeUTF8(sealedBoxOpenResult)
  console.log('Unencrypted private token: ', privateToken)
  return privateToken
}

function generateKeys(blake2bHashOfHostnameAsSalt, passphrase){
  return new Promise((resolve, reject) => {
    session25519(blake2bHashOfHostnameAsSalt, passphrase, function (error, keys) {
      if (error) {
        console.log('error', error)
        return reject(error)
      }
      resolve(keys)
    })
  })
}

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
