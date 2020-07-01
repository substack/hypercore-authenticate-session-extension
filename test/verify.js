var test = require('tape')
var SignNoiseKeyExt = require('../')
var Proto = require('hypercore-protocol')
var hcrypto = require('hypercore-crypto')

test('verify over hypercore-protocol with implicit noise keys', function (t) {
  t.plan(4)
  var A = {
    proto: new Proto(true, { live: true }),
    keys: hcrypto.keyPair()
  }
  var B = {
    proto: new Proto(false, { live: true }),
    keys: hcrypto.keyPair()
  }
  A.proto.registerExtension('sign-noise-key', SignNoiseKeyExt({
    localFeedPublicKey: A.keys.publicKey,
    localFeedSecretKey: A.keys.secretKey,
    onVerify: function (ok, remotePK) {
      t.ok(ok, 'verified B from A')
      t.deepEqual(remotePK, B.keys.publicKey)
    }
  }))
  B.proto.registerExtension('sign-noise-key', SignNoiseKeyExt({
    localFeedPublicKey: B.keys.publicKey,
    localFeedSecretKey: B.keys.secretKey,
    onVerify: function (ok, remotePK) {
      t.ok(ok, 'verified A from B')
      t.deepEqual(remotePK, A.keys.publicKey)
    }
  }))
  A.proto.pipe(B.proto).pipe(A.proto)
})

test('verify over hypercore-protocol with explicit noise keys', function (t) {
  t.plan(4)
  var A = {
    proto: new Proto(true, { live: true }),
    keys: hcrypto.keyPair()
  }
  var B = {
    proto: new Proto(false, { live: true }),
    keys: hcrypto.keyPair()
  }
  A.proto.registerExtension('sign-noise-key', SignNoiseKeyExt({
    localFeedPublicKey: A.keys.publicKey,
    localFeedSecretKey: A.keys.secretKey,
    localNoisePublicKey: A.proto.publicKey,
    remoteNoisePublicKey: B.proto.publicKey,
    onVerify: function (ok, remotePK) {
      t.ok(ok, 'verified B from A')
      t.deepEqual(remotePK, B.keys.publicKey)
    }
  }))
  B.proto.registerExtension('sign-noise-key', SignNoiseKeyExt({
    localFeedPublicKey: B.keys.publicKey,
    localFeedSecretKey: B.keys.secretKey,
    localNoisePublicKey: B.proto.publicKey,
    remoteNoisePublicKey: A.proto.publicKey,
    onVerify: function (ok, remotePK) {
      t.ok(ok, 'verified A from B')
      t.deepEqual(remotePK, A.keys.publicKey)
    }
  }))
  A.proto.pipe(B.proto).pipe(A.proto)
})
