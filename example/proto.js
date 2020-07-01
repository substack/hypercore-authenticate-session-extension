var signNoiseKeyExt = require('../')
var Proto = require('hypercore-protocol')
var hcrypto = require('hypercore-crypto')

var A = {
  proto: new Proto(true, { live: true }),
  keys: hcrypto.keyPair()
}
var B = {
  proto: new Proto(false, { live: true }),
  keys: hcrypto.keyPair()
}
console.log('A.keys.publicKey=', A.keys.publicKey.toString('hex'))
console.log('B.keys.publicKey=', B.keys.publicKey.toString('hex'))

A.proto.registerExtension('sign-noise-key', signNoiseKeyExt({
  localFeedPublicKey: A.keys.publicKey,
  localFeedSecretKey: A.keys.secretKey,
  onVerify: function (ok, remotePubKey) {
    console.log('A: ok=',ok, 'remotePubKey=', remotePubKey.toString('hex'))
  }
}))
B.proto.registerExtension('sign-noise-key', signNoiseKeyExt({
  localFeedPublicKey: B.keys.publicKey,
  localFeedSecretKey: B.keys.secretKey,
  onVerify: function (ok, remotePubKey) {
    console.log('B: ok=',ok, 'remotePubKey=', remotePubKey.toString('hex'))
  }
}))
A.proto.pipe(B.proto).pipe(A.proto)
