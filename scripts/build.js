
var db = {}

// initialize with all the IANA types
var mime = require('../src/iana.json')
Object.keys(mime).forEach(function (type) {
  var d = mime[type]
  var t = type.toLowerCase()
  var o = db[t] = db[t] || {source: 'iana'}
})

// add the mime extensions from Apache
var mime = require('../src/mime.json')
Object.keys(mime).forEach(function (type) {
  var d = mime[type]
  var t = type.toLowerCase()
  var o = db[t] = db[t] || {source: 'apache'}
  if (d.extensions && d.extensions.length) o.extensions = (o.extensions || []).concat(d.extensions)
})

// add all of node mime's mime extensions
// though i think we should just put this in `types.json`
var mime = require('../src/node.json')
Object.keys(mime).forEach(function (type) {
  var d = mime[type]
  var t = type.toLowerCase()
  var o = db[t] = db[t] || {}
  if (d.extensions && d.extensions.length) o.extensions = (o.extensions || []).concat(d.extensions)
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
