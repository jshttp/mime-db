const { request } = require('undici')

// Undici does not send the user-agent header, which causes the request to fail for the IANA script.
module.exports.request = async function (url, options) {
  return request(url, {
    ...options,
    headers: { 'User-Agent': 'node' }
  })
}
