
/**
 * Convert the IANA definitions from CSV to local.
 */

var co = require('co')
var fs = require('fs')
var cogent = require('cogent')
var parser = require('csv-parse')
var toArray = require('stream-to-array')

co(function* () {
  var results = yield [
    get('application'),
    get('audio'),
    get('image'),
    get('message'),
    get('model'),
    get('multipart'),
    get('text'),
    get('audio'),
  ]

  fs.writeFileSync('src/iana.json', JSON.stringify(results.reduce(concat, [])))
})()

function* get(type) {
  var res = yield* cogent('http://www.iana.org/assignments/media-types/' + type + '.csv')
  if (res.statusCode !== 200)
    throw new Error('got status code ' + res.statusCode + ' from ' + type)

  var mimes = yield toArray(res.pipe(parser()))
  mimes.shift() // remove the header
  return mimes.map(function (mime) {
    mime.push(type)
    return mime
  })
}

function concat(a, b) {
  return a.concat(b)
}
