var test = require('tape')
var signNoiseKeyExt = require('../')
var hcrypto = require('hypercore-crypto')
var hypercore = require('hypercore')
var Proto = require('hypercore-protocol')
var ram = require('random-access-memory')
var collect = require('collect-stream')

test('verify over hypercore', function (t) {
  t.plan(6)
  var A = {
    local: hypercore(ram),
    remote: null,
    proto: new Proto(true)
  }
  var B = {
    local: hypercore(ram),
    remote: null,
    proto: new Proto(false)
  }
  A.local.append('hello')
  A.local.ready(function () {
    A.proto.registerExtension('sign-noise-key', signNoiseKeyExt({
      localFeedPublicKey: A.local.key,
      localFeedSecretKey: A.local.secretKey,
      onVerify: function (ok, remotePK) {
        t.ok(ok, 'verified B from A')
        t.deepEqual(remotePK, B.local.key)
        // verified. now open the feed for replication
        A.local.replicate(A.proto)
      }
    }))
  })
  B.local.ready(function () {
    B.proto.registerExtension('sign-noise-key', signNoiseKeyExt({
      localFeedPublicKey: B.local.key,
      localFeedSecretKey: B.local.secretKey,
      onVerify: function (ok, remotePK) {
        t.ok(ok, 'verified A from B')
        t.deepEqual(remotePK, A.local.key)
        // now download A's feed
        B.remote = hypercore(ram, { key: remotePK })
        B.remote.replicate(B.proto).once('end', function () {
          collect(B.remote.createReadStream(), function (err, buf) {
            t.error(err)
            t.deepEqual(buf, Buffer.from('hello'))
          })
        })
      }
    }))
  })
  A.proto.pipe(B.proto).pipe(A.proto)
})
