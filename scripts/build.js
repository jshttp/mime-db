
var db = {}

// initialize with all the IANA types
require('../src/iana.json').forEach(function (mime) {
  // i don't think the name is useful,
  // and i don't think we need to bother with the "Reference"
  // just look at the site yourself!

  if (mime.template.substr(-8) === '/example') {
    // ignore example templates
    return
  }

  var template = mime.template

  if (!template) {
    // some types don't have a template, so we guess it
    console.log('guessing: %s/%s', mime.type, mime.name)
    template = mime.type + '/' + mime.name
  }

  if (!~template.indexOf('/')) {
    // i don't know what templates exactly are,
    // but some aren't valid mime types.
    console.log('prefixing: %s/%s', mime.type, template)
    template = mime.type + '/' + template
  }

  db[template.toLowerCase()] = {
    source: 'iana'
  }
})

// add the mime extensions from Apache
var mime = require('../src/mime.json')
Object.keys(mime).forEach(function (type) {
  var e = mime[type]
  var t = type.toLowerCase()
  var o = db[t] = db[t] || {source: 'apache'}
  if (e.length) o.extensions = (o.extensions || []).concat(e)
})

// add all of node mime's mime extensions
// though i think we should just put this in `types.json`
var mime = require('../src/node.json')
Object.keys(mime).forEach(function (type) {
  var e = mime[type]
  var t = type.toLowerCase()
  var o = db[t] = db[t] || {}
  if (e.length) o.extensions = (o.extensions || []).concat(e)
})

// now add all our custom extensions
var mime = require('../lib/extensions.json')
Object.keys(mime).forEach(function (type) {
  var e = mime[type]
  var t = type.toLowerCase()
  var o = db[t] = db[t] || {}
  if (e.length) o.extensions = (o.extensions || []).concat(e)
})

// add all the compressible metadata
var mime = require('../lib/compressible.json')
Object.keys(mime).sort().forEach(function (type) {
  var e = mime[type]
  var t = type.toLowerCase()

  if (type[0] === '+') {
    // suffix handling
    Object.keys(db).forEach(function (type) {
      if (type.substr(0 - t.length) !== t) return
      db[type].compressible = e.compressible
    })
    return
  }

  var o = db[t] = db[t] || {}
  o.compressible = e.compressible
})

// set the default charsets
var charsets = require('../lib/charsets')
Object.keys(charsets).forEach(function (name) {
  db[name].charset = charsets[name]
})

// write db
require('./lib/write-db')('db.json', db)
