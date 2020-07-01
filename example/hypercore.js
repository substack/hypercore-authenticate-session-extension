var authSessionExt = require('../')
var Proto = require('hypercore-protocol')
var hypercore = require('hypercore')
var { randomBytes } = require('crypto')
var to = require('to2')

var A = {
  proto: new Proto(true),
  feed: hypercore('/tmp/a-'+randomBytes(8).toString('hex'))
}
var B = {
  proto: new Proto(false),
  feed: hypercore('/tmp/b-'+randomBytes(8).toString('hex'))
}
A.feed.append('hello')
A.feed.append('world')

ready([A.feed,B.feed], function () {
  A.proto.registerExtension('auth-session', authSessionExt({
    localFeedPublicKey: A.feed.key,
    localFeedSecretKey: A.feed.secretKey,
    onVerify: function (ok, remotePubKey) {
      console.log('A:ONVERIFY', ok, remotePubKey)
      if (!ok) return console.error('verification failed')
      // you could decide to not replicate with remotePubKey here
      A.feed.replicate(A.proto)
    }
  }))
  B.proto.registerExtension('auth-session', authSessionExt({
    localFeedPublicKey: B.feed.key,
    localFeedSecretKey: B.feed.secretKey,
    onVerify: function (ok, remotePubKey) {
      console.log('B:ONVERIFY', ok, remotePubKey)
      if (!ok) return console.error('verification failed')
      // you could decide to not replicate with remotePubKey here
      var clone = hypercore('/tmp/clone-'+remotePubKey.toString('hex'), {
        key: remotePubKey
      })
      clone.replicate(B.proto).once('end', function () {
        clone.createReadStream().pipe(to(function (buf, enc, next) {
          console.log('cloned data: ' + buf)
          next()
        }))
      })
    }
  }))
  A.proto.pipe(B.proto).pipe(A.proto)
})

function ready (feeds, cb) {
  var pending = 1 + feeds.length
  feeds.forEach(feed => feed.ready(() => { if (--pending === 0) cb() }))
  if (--pending === 0) cb()
}
