const hcrypto = require('hypercore-crypto')

module.exports = function (opts) {
  return function (ext) {
    var msgIndex = 0
    var remoteFeedPublicKey = null
    ext.local.handlers.on('handshake', function () {
      ext.send(toBuf(opts.localFeedPublicKey))
      ext.send(hcrypto.sign(
        ext.local.handlers.state.handshakeHash,
        toBuf(opts.localFeedSecretKey)
      ))
    })
    return {
      onmessage: function (message) {
        if (msgIndex === 0) {
          remoteFeedPublicKey = message
        } else if (msgIndex === 1) {
          var ok = hcrypto.verify(
            ext.local.handlers.state.handshakeHash,
            message,
            remoteFeedPublicKey
          )
          if (typeof opts.onVerify === 'function') {
            opts.onVerify(ok, remoteFeedPublicKey)
          }
        }
        msgIndex++
      }
    }
  }
}

function toBuf (x) {
  if (Buffer.isBuffer(x)) return x
  if (/^[0-9A-Fa-f]+$/.test(x)) return Buffer.from(x, 'hex')
  throw new Error('expected buffer or hex string')
}
