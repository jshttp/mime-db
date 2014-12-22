
/**
 * Convert the IANA definitions from CSV to local.
 */

var co = require('co')
var fs = require('fs')
var getRawBody = require('raw-body')
var cogent = require('cogent')
var parser = require('csv-parse')
var toArray = require('stream-to-array')
var writedb = require('./lib/write-db')

var leadingSpacesRegExp = /^\s+/
var listColonRegExp = /:(?:\s|$)/m
var mimeTypeLineRegExp = /^(?:\s*|[^:\s-]*\s+)(?:MIME type(?: name)?|MIME media type(?: name)?|Media type(?: name)?|Type name)\s?:\s+(.*)$/im
var mimeSubtypeLineRegExp = /^[^:\s-]*\s*(?:MIME |Media )?subtype(?: name)?\s?:\s+(?:[a-z]+ Tree (?:\- ?)?|(?:[a-z]+ )+\- )?([^\(\[\r\n]*).*$/im
var mimeSubtypesLineRegExp = /^[^:\s-]*\s*(?:MIME |Media )?subtype(?: names)?\s?:\s+(?:[a-z]+ Tree (?:\- ?)?)?(.*)$/im
var symbolRegExp = /[\._-]/g
var trimQuotesRegExp = /^"|"$/gm

co(function* () {
  var gens = yield [
    get('application'),
    get('audio'),
    get('image'),
    get('message'),
    get('model'),
    get('multipart'),
    get('text'),
  ]

  // flatten generators
  gens = gens.reduce(concat, [])

  // get results in groups
  var results = []
  while (gens.length !== 0) {
    results.push(yield gens.splice(0, 10))
  }

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

  writedb('src/iana.json', json)
})()

function addTemplateData(data) {
  if (!data.template) {
    return data
  }

  return function* get() {
    var res = yield* cogent('http://www.iana.org/assignments/media-types/' + data.template)
    var ref = data.type + '/' + data.name.replace(/ .*/, '')

    if (res.statusCode === 404 && data.template !== ref) {
      console.log('template ' + data.template + ' not found')
      data.template = ref
      res = yield* cogent('http://www.iana.org/assignments/media-types/' + ref)

      // replace the guessed mime
      if (res.statusCode === 200) {
        data.mime = data.template
      }
    }

    if (res.statusCode === 404) {
      console.log('template ' + data.template + ' not found')
      return data
    }

    if (res.statusCode !== 200)
      throw new Error('got status code ' + res.statusCode + ' from template ' + data.template)

    var body = yield getTemplateBody(res)
    var mime = extractTemplateMime(body)

    // use extracted mime if it's almost the same
    if (mime && mime.replace(symbolRegExp, '-') === data.mime.replace(symbolRegExp, '-')) {
      data.mime = mime
    }

    return data
  }
}

function extractTemplateMime(body) {
  var type = mimeTypeLineRegExp.exec(body)
  var subtype = mimeSubtypeLineRegExp.exec(body)

  if (!subtype && (subtype = mimeSubtypesLineRegExp.exec(body)) && !/^[A-Za-z0-9]+$/.test(subtype[1])) {
    return
  }

  if (!type || !subtype) {
    return
  }

  type = type[1].trim().replace(trimQuotesRegExp, '')
  subtype = subtype[1].trim().replace(trimQuotesRegExp, '')

  if (!subtype) {
    return
  }

  if (subtype.substr(0, type.length + 1) === type + '/') {
    // strip type from subtype
    subtype = subtype.substr(type.length + 1)
  }

  return (type + '/' + subtype).toLowerCase()
}

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

    return addTemplateData(data)
  })
}

function* getTemplateBody(res) {
  var body = yield getRawBody(res, {encoding: 'ascii'})
  var lines = body.split(/\r?\n/)

  return lines.reduce(function (lines, line) {
    var prev = (lines[lines.length - 1] || '').trim()
    var match = leadingSpacesRegExp.exec(line)

    if (match && match[0].length >= 3 && match[0].trim() !== 0 && prev.length !== 0 && !listColonRegExp.test(line)) {
      lines[lines.length - 1] += ' ' + line.trimLeft()
    } else {
      lines.push(line)
    }

    return lines
  }, []).slice(1).join('\n')
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
