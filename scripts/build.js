
var db = {}

// initialize with all the IANA types
var mime = require('../src/iana.json')
Object.keys(mime).forEach(function (type) {
  var d = mime[type]
  var t = type.toLowerCase()
  var o = db[t] = db[t] || {source: 'iana'}
})

// add the mime extensions from Apache
var mime = require('../src/apache.json')
Object.keys(mime).forEach(function (type) {
  var d = mime[type]
  var t = type.toLowerCase()
  var o = db[t] = db[t] || {source: 'apache'}
  if (d.extensions && d.extensions.length) o.extensions = (o.extensions || []).concat(d.extensions)
})

// now add all our custom data
var mime = require('../src/custom.json')
Object.keys(mime).forEach(function (type) {
  var d = mime[type]
  var t = type.toLowerCase()
  var o = db[t] = db[t] || {}
  if (d.charset !== undefined) o.charset = d.charset
  if (d.compressible !== undefined) o.compressible = d.compressible
  if (d.extensions && d.extensions.length) o.extensions = (o.extensions || []).concat(d.extensions)
})

// finally, all custom suffix defaults
var mime = require('../src/custom-suffix.json')
Object.keys(mime).forEach(function (suffix) {
  var s = mime[suffix]

  Object.keys(db).forEach(function (type) {
    if (type.substr(0 - suffix.length) !== suffix) {
      return
    }

    var d = db[type]
    if (d.compressible === undefined) d.compressible = s.compressible
  })
})

// write db
require('./lib/write-db')('db.json', db)
