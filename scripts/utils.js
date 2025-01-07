const { request } = require('undici')

module.exports.request = async function (url, options) {
  return request(url, {
    ...options,
    headers: { 'User-Agent': 'node' }
  })
}
