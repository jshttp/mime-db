/*!
 * mime-db
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015-2022 Douglas Christopher Wilson
 * MIT Licensed
 */

var db = {}
var ext = {}

// initialize with all the IANA types
addData(db, ext, require('../src/iana-types.json'), 'iana')

// add the mime extensions from Apache
addData(db, ext, require('../src/apache-types.json'), 'apache')

// add the mime extensions from nginx
addData(db, ext, require('../src/nginx-types.json'), 'nginx')

// now add all our custom data
addData(db, ext, require('../src/custom-types.json'))

// finally, all custom suffix defaults
var mime = require('../src/custom-suffix.json')
Object.keys(mime).forEach(function (suffix) {
  var s = mime[suffix]

  Object.keys(db).forEach(function (type) {
    if (type.slice(-suffix.length) !== suffix) {
      return
    }

    var d = db[type]
    if (d.compressible === undefined) d.compressible = s.compressible
  })
})

// write db
require('./lib/write-db')('db.json', db)
require('./lib/write-db-ext')('db-ext.json', ext)

/**
 * Add mime data to the db, marked as a given source.
 */
function addData (db, ext, mime, source) {
  Object.keys(mime).forEach(function (key) {
    var data = mime[key]
    var type = key.toLowerCase()
    var obj = db[type] = db[type] || createTypeEntry(source)

    // add missing data
    setValue(obj, 'charset', data.charset)
    setValue(obj, 'compressible', data.compressible)

    if (data.extensions) {
      // append new extensions
      appendExtensions(obj, data.extensions)

      // add extensions to extension lookup
      addExtensionData(ext, type, data.extensions)
    }
  })
}

/**
 * Add extension data to the extension db.
 */
function addExtensionData (db, type, extensions) {
  for (var i = 0; i < extensions.length; i++) {
    var extension = extensions[i]
    var list = ext[extension] || (ext[extension] = [])

    // add type to the extension entry
    if (list.indexOf(type) === -1) {
      list.push(type)
    }
  }
}

/**
 * Append an extension to an object.
 */
function appendExtension (obj, extension) {
  if (!obj.extensions) {
    obj.extensions = []
  }

  if (obj.extensions.indexOf(extension) === -1) {
    obj.extensions.push(extension)
  }
}

/**
 * Append extensions to an object.
 */
function appendExtensions (obj, extensions) {
  for (var i = 0; i < extensions.length; i++) {
    var extension = extensions[i]

    // add extension to the type entry
    appendExtension(obj, extension)
  }
}

/**
 * Create a new type entry, optionally marked from a source.
 */
function createTypeEntry (source) {
  var obj = {}

  if (source !== undefined) {
    obj.source = source
  }

  return obj
}

/**
 * Set a value on an object, if not already set.
 */
function setValue (obj, prop, value) {
  if (value !== undefined && obj[prop] === undefined) {
    obj[prop] = value
  }
}
