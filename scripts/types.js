
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
  ]

  // flatten results
  results = results.reduce(concat, [])

  var json = {}
  results.forEach(function (result) {
    var mime = result.mime

    if (mime in json && result.template !== json[mime].template) {
      throw new Error('duplicate entry for ' + mime)
    }

    delete result.mime
    json[mime] = result
  })

  fs.writeFileSync('src/iana.json', JSON.stringify(json))
})()

function* get(type) {
  var res = yield* cogent('http://www.iana.org/assignments/media-types/' + encodeURIComponent(type) + '.csv')
  if (res.statusCode !== 200)
    throw new Error('got status code ' + res.statusCode + ' from ' + type)

  var mimes = yield toArray(res.pipe(parser()))
  var headers = mimes.shift().map(normalizeHeader)
  var reduceRows = generateRowMapper(headers)

  return mimes.map(function (row) {
    var data = row.reduce(reduceRows, {type: type})

    if (data.template === type + '/example') {
      return
    }

    // guess mime type
    data.mime = (data.template || (type + '/' + data.name)).toLowerCase()

    return data
  })
}

function concat(a, b) {
  return a.concat(b.filter(Boolean))
}

function generateRowMapper(headers) {
  return function reduceRows(obj, val, index) {
    obj[headers[index]] = val
    return obj
  }
}

function normalizeHeader(val) {
  return val.substr(0, 1).toLowerCase() + val.substr(1).replace(/ (.)/, function (s, c) {
    return c.toUpperCase()
  })
}
