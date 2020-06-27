
/**
 * Convert the IANA definitions from CSV to local.
 */

global.Promise = global.Promise || loadBluebird()

var co = require('co')
var getRawBody = require('raw-body')
var cogent = require('cogent')
var parser = require('csv-parse')
var toArray = require('stream-to-array')
var typer = require('media-typer')
var writedb = require('./lib/write-db')

var intendedUsageRegExp = /^\s*(?:(?:\d{1,2}\.|o)\s+)?Intended\s+Usage\s*:\s*(\S+)/im
var leadingSpacesRegExp = /^\s+/
var listColonRegExp = /:(?:\s|$)/m
var nameWithNotesRegExp = /^(\S+)(?: - (.*)$| \((.*)\)$|)/
var mimeTypeLineRegExp = /^(?:\s*|[^:\s-]*\s+)(?:MIME type(?: name)?|MIME media type(?: name)?|Media type(?: name)?|Type name)\s?:\s+(.*)$/im
var mimeSubtypeLineRegExp = /^[^:\s-]*\s*(?:MIME |Media )?subtype(?: name)?\s?:\s+(?:[a-z]+ Tree\s+(?:- ?)?|(?:[a-z]+ )+- )?([^([\r\n]*).*$/im
var mimeSubtypesLineRegExp = /^[^:\s-]*\s*(?:MIME |Media )?subtype(?: names)?\s?:\s+(?:[a-z]+ Tree\s+(?:- ?)?)?(.*)$/im
var rfcReferenceRegExp = /\[(RFC[0-9]{4})]/gi
var slurpModeRegExp = /^\s{0,3}(?:[1-4]\. )?[a-z]{4,}(?: [a-z]{4,})+(?:s|\(s\))?\s*:\s*/i
var symbolRegExp = /[._-]/g
var trimQuotesRegExp = /^"|"$/gm
var urlReferenceRegExp = /\[(https?:\/\/[^\]]+)]/gi

var CHARSET_DEFAULT_REGEXP = /(?:\bcharset\b[^.]*(?:\.\s+default\s+(?:value\s+)?is|\bdefault[^.]*(?:of|is)|\bmust\s+have\s+the\s+value|\bvalue\s+must\s+be)\s+|\bcharset\s*\(?defaults\s+to\s+|\bdefault\b[^.]*?\bchar(?:set|act[eo]r\s+set)\b[^.]*?(?:of|is)\s+|\bcharset\s+(?:must|is)\s+always\s+(?:be\s+)?)["']?([a-z0-9]+-[a-z0-9-]+)/im
var EXTENSIONS_REGEXP = /(?:^\s*(?:\d\.\s+)?|\s+[23]\.\s+)[Ff]ile [Ee]xtension(?:\(s\)|s|)\s?:\s+(?:\*\.|\.|)([0-9a-z_-]+|[0-9A-Z_-]+)(?:(?:\s+or|\s*,|)\s+(?:\*\.|\.|)([0-9a-z_-]+|[0-9A-Z_-]+)\s*)?(?:\s*[34]\.\s+|\s+[A-Z(]|\s*$)/m
var EXTENSIONS_QUOTED_REGEXP = /^\s*(?:\d\.\s+)?[Ff]ile [Ee]xtension(?:\(s\)|s|)\s?:(?:[^'"\r\n]+)(?:"\.?([0-9a-z_-]+)"|'\.?([0-9a-z_-]+)')(?:\s+(?:and|or)\s+(?:"\.?([0-9a-z_-]+)"|'\.?([0-9a-z_-]+)'))?/im
var MIME_TYPE_HAS_CHARSET_PARAMETER_REGEXP = /parameters\s*:[^.]*\bcharset\b/im

co(function * () {
  var gens = yield [
    get('application', { extensions: /(?:\/(?:ecmascript|express|gzip|(?:ld|manifest)\+json|n-quads|n-triples|pgp-.+|trig|vnd\.(?:age|apple\..+|dbf|mapbox-vector-tile|rar))|\+xml)$/ }),
    get('audio', { extensions: /\/mobile-xmf$/ }),
    get('font', { extensions: true }),
    get('image', { extensions: true }),
    get('message', { extensions: true }),
    get('model', { extensions: true }),
    get('multipart'),
    get('text', { extensions: /\/(?:spdx|turtle|vnd\.familysearch\.gedcom|vtt)$/ }),
    get('video', { extensions: /\/iso\.segment$/ })
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

  // gather extension frequency
  var exts = Object.create(null)
  results.forEach(function (result) {
    (result.extensions || []).forEach(function (ext) {
      exts[ext] = (exts[ext] || 0) + 1
    })
  })

  // construct json map
  var json = Object.create(null)
  results.forEach(function (result) {
    var mime = result.mime

    if (mime in json) {
      throw new Error('duplicate entry for ' + mime)
    }

    json[mime] = {
      charset: result.charset,
      notes: result.notes,
      sources: result.sources
    }

    // keep unambigious extensions
    var extensions = (result.extensions || []).filter(function (ext) {
      return exts[ext] === 1 || typer.parse(mime).subtype === ext
    })

    if (extensions.length !== 0) {
      json[mime].extensions = extensions
    }
  })

  writedb('src/iana-types.json', json)
}).then()

function addTemplateData (data, options) {
  var opts = options || {}

  if (!data.template) {
    return data
  }

  return function * get () {
    var res = yield * cogent('http://www.iana.org/assignments/media-types/' + data.template, { retries: 3 })
    var ref = data.type + '/' + data.name
    var rfc = getRfcReferences(data.reference)[0]

    if (res.statusCode === 404 && data.template !== ref) {
      console.log('template ' + data.template + ' not found, retry as ' + ref)
      data.template = ref
      res = yield * cogent('http://www.iana.org/assignments/media-types/' + ref, { retries: 3 })

      // replace the guessed mime
      if (res.statusCode === 200) {
        data.mime = data.template
      }
    }

    if (res.statusCode === 404 && rfc !== undefined) {
      console.log('template ' + data.template + ' not found, fetch ' + rfc)
      res = yield * cogent('http://tools.ietf.org/rfc/' + rfc.toLowerCase() + '.txt')
    }

    if (res.statusCode === 404) {
      console.log('template ' + data.template + ' not found')
      return data
    }

    if (res.statusCode !== 200) {
      throw new Error('got status code ' + res.statusCode + ' from template ' + data.template)
    }

    var body = yield getTemplateBody(res)
    var href = res.urls[0].href
    var mime = extractTemplateMime(body)

    // add the template as a source
    addSource(data, href)

    if (mimeEql(mime, data.mime)) {
      // use extracted mime
      data.mime = mime

      // use extracted charset
      data.charset = extractTemplateCharset(body)

      // use extracted extensions
      var useExt = opts.extensions &&
        (opts.extensions === true || opts.extensions.test(data.mime))
      if (useExt && extractIntendedUsage(body) === 'common') {
        data.extensions = extractTemplateExtensions(body)
        if (!data.extensions) {
          console.log('===== %s =====', mime)
          console.log(((body.match(/extension\(.{1,40}/ims) || [])[0] || '').split('\n')[0])
        }
      }
    }

    return data
  }
}

function extractIntendedUsage (body) {
  var match = intendedUsageRegExp.exec(body)

  return match
    ? match[1].toLocaleLowerCase()
    : undefined
}

function extractTemplateMime (body) {
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

function extractTemplateCharset (body) {
  if (!MIME_TYPE_HAS_CHARSET_PARAMETER_REGEXP.test(body)) {
    return undefined
  }

  var match = CHARSET_DEFAULT_REGEXP.exec(body)

  return match
    ? match[1].toUpperCase()
    : undefined
}

function extractTemplateExtensions (body) {
  var match = EXTENSIONS_REGEXP.exec(body) || EXTENSIONS_QUOTED_REGEXP.exec(body)

  if (!match) {
    return
  }

  var exts = match
    .slice(1)
    .filter(Boolean)
    .map(function (ext) { return ext.toLowerCase() })
    .filter(function (ext) { return ext !== 'none' })

  return exts.length === 0
    ? undefined
    : exts
}

function * get (type, options) {
  var res = yield * cogent('http://www.iana.org/assignments/media-types/' + encodeURIComponent(type) + '.csv', { retries: 3 })

  if (res.statusCode !== 200) {
    throw new Error('got status code ' + res.statusCode + ' from ' + type)
  }

  var mimes = yield toArray(res.pipe(parser()))
  var headers = mimes.shift().map(normalizeHeader)
  var reduceRows = generateRowMapper(headers)
  var templates = Object.create(null)

  return mimes.map(function (row) {
    var data = row.reduce(reduceRows, { type: type })

    if (data.template) {
      if (data.template === type + '/example') {
        return
      }

      if (templates[data.template]) {
        // duplicate entry
        return
      }

      templates[data.template] = true
    }

    // guess mime type
    data.mime = (data.template || (type + '/' + data.name)).toLowerCase()

    // extract notes from name
    var nameMatch = nameWithNotesRegExp.exec(data.name)
    data.name = nameMatch[1]
    data.notes = nameMatch[2] || nameMatch[3]

    // add reference sources
    parseReferences(data.reference).forEach(function (url) {
      addSource(data, url)
    })

    return addTemplateData(data, options)
  })
}

function * getTemplateBody (res) {
  var body = yield getRawBody(res, { encoding: 'ascii' })
  var lines = body.split(/\r?\n/)
  var slurp = false

  return lines.reduce(function (lines, line) {
    line = line.replace(/=20$/, ' ')

    var prev = (lines[lines.length - 1] || '')
    var match = leadingSpacesRegExp.exec(line)

    if (slurp && line.trim().length === 0 && !/:\s*$/.test(prev)) {
      slurp = false
      return lines
    }

    if (slurpModeRegExp.test(line)) {
      slurp = false
      lines.push(line)
    } else if (slurp) {
      lines[lines.length - 1] = appendToLine(prev, line)
    } else if (match && match[0].length >= 3 && match[0].trim() !== 0 && prev.trim().length !== 0 && !listColonRegExp.test(line)) {
      lines[lines.length - 1] = appendToLine(prev, line)
    } else {
      lines.push(line)
    }

    // turn on slurp mode
    slurp = slurp || slurpModeRegExp.test(line)

    return lines
  }, []).join('\n')
}

function addSource (data, url) {
  var sources = data.sources || (data.sources = [])

  if (sources.indexOf(url) === -1) {
    sources.push(url)
  }
}

function appendToLine (line, str) {
  var trimmed = line.trimRight()
  var append = trimmed.substr(-1) === '-'
    ? str.trimLeft()
    : ' ' + str.trimLeft()
  return trimmed + append
}

function concat (a, b) {
  return a.concat(b.filter(Boolean))
}

function generateRowMapper (headers) {
  return function reduceRows (obj, val, index) {
    if (val !== '') {
      obj[headers[index]] = val
    }

    return obj
  }
}

function getRfcReferences (reference) {
  var match = null
  var rfcs = []

  rfcReferenceRegExp.index = 0

  while ((match = rfcReferenceRegExp.exec(reference))) {
    rfcs.push(match[1].toUpperCase())
  }

  return rfcs
}

function getUrlReferences (reference) {
  var match = null
  var urls = []

  urlReferenceRegExp.index = 0

  while ((match = urlReferenceRegExp.exec(reference))) {
    urls.push(match[1])
  }

  return urls
}

function loadBluebird () {
  var Promise = require('bluebird')

  // Silence all warnings
  Promise.config({
    warnings: false
  })

  return Promise
}

function mimeEql (mime1, mime2) {
  return mime1 && mime2 &&
    mime1.replace(symbolRegExp, '-') === mime2.replace(symbolRegExp, '-')
}

function normalizeHeader (val) {
  return val.substr(0, 1).toLowerCase() + val.substr(1).replace(/ (.)/, function (s, c) {
    return c.toUpperCase()
  })
}

function parseReferences (reference) {
  return getUrlReferences(reference).concat(getRfcReferences(reference).map(function (rfc) {
    return 'http://tools.ietf.org/rfc/' + rfc.toLowerCase() + '.txt'
  }))
}
