var test = require('tape')
var authSessionExt = require('../')
var Proto = require('hypercore-protocol')
var hcrypto = require('hypercore-crypto')

test('fail to verify over hypercore-protocol: B from A', function (t) {
  t.plan(4)
  var A = {
    proto: new Proto(true, { live: true }),
    keys: hcrypto.keyPair()
  }
  var B = {
    proto: new Proto(false, { live: true }),
    keys: hcrypto.keyPair()
  }
  var bFailKey = flip(B.keys.publicKey)
  A.proto.registerExtension('auth-session', authSessionExt({
    localFeedPublicKey: A.keys.publicKey,
    localFeedSecretKey: A.keys.secretKey,
    onVerify: function (ok, remotePK) {
      t.notOk(ok, 'failed to verify B from A')
      t.deepEqual(remotePK, bFailKey)
    }
  }))
  B.proto.registerExtension('auth-session', authSessionExt({
    localFeedPublicKey: bFailKey,
    localFeedSecretKey: B.keys.secretKey,
    onVerify: function (ok, remotePK) {
      t.ok(ok, 'verified A from B')
      t.deepEqual(remotePK, A.keys.publicKey)
    }
  }))
  A.proto.pipe(B.proto).pipe(A.proto)
})

test('fail to verify over hypercore-protocol: A from B', function (t) {
  t.plan(4)
  var A = {
    proto: new Proto(true, { live: true }),
    keys: hcrypto.keyPair()
  }
  var B = {
    proto: new Proto(false, { live: true }),
    keys: hcrypto.keyPair()
  }
  var aFailKey = flip(A.keys.publicKey)
  A.proto.registerExtension('auth-session', authSessionExt({
    localFeedPublicKey: aFailKey,
    localFeedSecretKey: A.keys.secretKey,
    onVerify: function (ok, remotePK) {
      t.ok(ok, 'verified B from A')
      t.deepEqual(remotePK, B.keys.publicKey)
    }
  }))
  B.proto.registerExtension('auth-session', authSessionExt({
    localFeedPublicKey: B.keys.publicKey,
    localFeedSecretKey: B.keys.secretKey,
    onVerify: function (ok, remotePK) {
      t.notOk(ok, 'failed to verify A from B')
      t.deepEqual(remotePK, aFailKey)
    }
  }))
  A.proto.pipe(B.proto).pipe(A.proto)
})

test('fail to verify over hypercore-protocol: A and B', function (t) {
  t.plan(4)
  var A = {
    proto: new Proto(true, { live: true }),
    keys: hcrypto.keyPair()
  }
  var B = {
    proto: new Proto(false, { live: true }),
    keys: hcrypto.keyPair()
  }
  var aFailKey = flip(A.keys.publicKey)
  var bFailKey = flip(B.keys.publicKey)
  A.proto.registerExtension('auth-session', authSessionExt({
    localFeedPublicKey: aFailKey,
    localFeedSecretKey: A.keys.secretKey,
    onVerify: function (ok, remotePK) {
      t.notOk(ok, 'failed to verify B from A')
      t.deepEqual(remotePK, bFailKey)
    }
  }))
  B.proto.registerExtension('auth-session', authSessionExt({
    localFeedPublicKey: bFailKey,
    localFeedSecretKey: B.keys.secretKey,
    onVerify: function (ok, remotePK) {
      t.notOk(ok, 'failed to verify A from B')
      t.deepEqual(remotePK, aFailKey)
    }
  }))
  A.proto.pipe(B.proto).pipe(A.proto)
})

test('fail to verify from secret key: B from A', function (t) {
  t.plan(4)
  var A = {
    proto: new Proto(true, { live: true }),
    keys: hcrypto.keyPair()
  }
  var B = {
    proto: new Proto(false, { live: true }),
    keys: hcrypto.keyPair()
  }
  A.proto.registerExtension('auth-session', authSessionExt({
    localFeedPublicKey: A.keys.publicKey,
    localFeedSecretKey: A.keys.secretKey,
    onVerify: function (ok, remotePK) {
      t.notOk(ok, 'failed to verify B from A')
      t.deepEqual(remotePK, B.keys.publicKey)
    }
  }))
  B.proto.registerExtension('auth-session', authSessionExt({
    localFeedPublicKey: B.keys.publicKey,
    localFeedSecretKey: flip(B.keys.secretKey),
    onVerify: function (ok, remotePK) {
      t.ok(ok, 'verified A from B')
      t.deepEqual(remotePK, A.keys.publicKey)
    }
  }))
  A.proto.pipe(B.proto).pipe(A.proto)
})

test('fail to verify from secret key: A from B', function (t) {
  t.plan(4)
  var A = {
    proto: new Proto(true, { live: true }),
    keys: hcrypto.keyPair()
  }
  var B = {
    proto: new Proto(false, { live: true }),
    keys: hcrypto.keyPair()
  }
  A.proto.registerExtension('auth-session', authSessionExt({
    localFeedPublicKey: A.keys.publicKey,
    localFeedSecretKey: flip(A.keys.secretKey),
    onVerify: function (ok, remotePK) {
      t.ok(ok, 'verified B from A')
      t.deepEqual(remotePK, B.keys.publicKey)
    }
  }))
  B.proto.registerExtension('auth-session', authSessionExt({
    localFeedPublicKey: B.keys.publicKey,
    localFeedSecretKey: B.keys.secretKey,
    onVerify: function (ok, remotePK) {
      t.notOk(ok, 'failed to verify A from B')
      t.deepEqual(remotePK, A.keys.publicKey)
    }
  }))
  A.proto.pipe(B.proto).pipe(A.proto)
})

test('fail to verify from secret key: A and B', function (t) {
  t.plan(4)
  var A = {
    proto: new Proto(true, { live: true }),
    keys: hcrypto.keyPair()
  }
  var B = {
    proto: new Proto(false, { live: true }),
    keys: hcrypto.keyPair()
  }
  A.proto.registerExtension('auth-session', authSessionExt({
    localFeedPublicKey: A.keys.publicKey,
    localFeedSecretKey: flip(A.keys.secretKey),
    onVerify: function (ok, remotePK) {
      t.notOk(ok, 'failed to verify B from A')
      t.deepEqual(remotePK, B.keys.publicKey)
    }
  }))
  B.proto.registerExtension('auth-session', authSessionExt({
    localFeedPublicKey: B.keys.publicKey,
    localFeedSecretKey: flip(B.keys.secretKey),
    onVerify: function (ok, remotePK) {
      t.notOk(ok, 'failed to verify A from B')
      t.deepEqual(remotePK, A.keys.publicKey)
    }
  }))
  A.proto.pipe(B.proto).pipe(A.proto)
})

function flip (buf) {
  // flip a single random bit in a buffer
  var nbuf = Buffer.from(buf)
  var i = Math.floor(Math.random()*nbuf.length)
  var j = Math.floor(Math.random()*8)
  nbuf[i] ^= 1<<j
  return nbuf
}
