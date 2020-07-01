# hypercore-sign-noise-key-extension

hypercore extension to verify the identity of peers by signing the noise key
with another key

If you use this module, make sure you generate a new unique noise key pair for
every replication session (this is the default behavior). *DO NOT* reuse noise
keys between sessions, as this introduces the possibility to perform a trivial
replay attack from whichever other peers received the same noise key.

# example

This example authenticates that the other peer can sign messages as
`remotePubKey` by signing the public noise key which authenticates the
protocol connection.

``` js
var signNoiseKeyExt = require('hypercore-sign-noise-key-extension')
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
```

output:

```
A.keys.publicKey= e65a2a0422a7b6e7655bfbf164ece7b740263142fee86aa24baa687dd96d069d
B.keys.publicKey= bc2594e5e2e3cae415d914ee99a1631619b1ef17095e211f96a854f9fb384f1d
B: ok= true remotePubKey= e65a2a0422a7b6e7655bfbf164ece7b740263142fee86aa24baa687dd96d069d
A: ok= true remotePubKey= bc2594e5e2e3cae415d914ee99a1631619b1ef17095e211f96a854f9fb384f1d
```

Or this example shows how you can obtain signing keys from a hypercore feed.
You might want to do this for an application where users are mostly identified
by their hypercore feeds.

``` js
var signNoiseKeyExt = require('hypercore-sign-noise-key-extension')
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
  A.proto.registerExtension('sign-noise-key', signNoiseKeyExt({
    localFeedPublicKey: A.feed.key,
    localFeedSecretKey: A.feed.secretKey,
    onVerify: function (ok, remotePubKey) {
      console.log('A:ONVERIFY', ok, remotePubKey)
      if (!ok) return console.error('verification failed')
      // you could decide to not replicate with remotePubKey here
      A.feed.replicate(A.proto)
    }
  }))
  B.proto.registerExtension('sign-noise-key', signNoiseKeyExt({
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
```

The main trick here is that you can hand-off a hypercore-protocol instance to
hypercore's replicate() method after the session has been authenticated.

# scheme

Each side opens an extension channel and sends a message containing the
localFeedPublicKey followed by a signature message proving ownership of the
localFeedPublicKey by signing the localNoisePublicKey with the
localFeedSecretKey.

This scheme avoids additional latency from a challenge/response but only works
when `localNoisePublicKey` is uniquely generated for each replication session
with a peer. *DO NOT* reuse noise public keys with this extension.

# api

``` js
var signNoiseKeyExt = require('hypercore-sign-noise-key-extension')
```

## var extFn = signNoiseKeyExt(opts)

Return `extFn` that can be passed to `proto.registerExtension()` for a
hypercore-protocol instance `proto`.

* `opts.localFeedPublicKey` - local public key you want to "identify" as
* `opts.localFeedSecretKey` - local secret key to sign the localNoisePublicKey
* `opts.localNoisePublicKey` - local public noise key to sign. read from the
  hypercore-protocol if not provided
* `opts.remoteNoisePublicKey` - remote public noise key to expect to be signed
  by the other side. read from hypercore-protocol if not provided
* `opts.onVerify(ok, remotePublicKey)` - function that gets called with a
  boolean `ok` which is true when the remotePublicKey was verified with a
  signature

In your `onVerify()` function you can check the `remotePublicKey` to decide
whether you wish to replicate with that key. And if `ok` is false you should
probably destroy the session.

# install

```
npm install hypercore-sign-noise-key-extension
```

# license

BSD
