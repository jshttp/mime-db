const { request } = require('undici')

module.exports.request = async function (url, options) {
  const res = await request(url, {
    ...options,
    headers: { 'User-Agent': 'node' }
  })

  return res
}
