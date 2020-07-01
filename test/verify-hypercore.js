var test = require('tape')
var authSessionExt = require('../')
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
  ready([A.local,B.local], function () {
    A.proto.registerExtension('auth-session', authSessionExt({
      localFeedPublicKey: A.local.key,
      localFeedSecretKey: A.local.secretKey,
      onVerify: function (ok, remotePK) {
        t.ok(ok, 'verified B from A')
        t.deepEqual(remotePK, B.local.key)
        // verified. now open the feed for replication
        A.local.replicate(A.proto)
      }
    }))
    B.proto.registerExtension('auth-session', authSessionExt({
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
    A.proto.pipe(B.proto).pipe(A.proto)
  })
})

function ready (feeds, cb) {
  var pending = 1 + feeds.length
  feeds.forEach(function (feed) {
    feed.ready(function () {
      if (--pending === 0) cb()
    })
  })
  if (--pending === 0) cb()
}
