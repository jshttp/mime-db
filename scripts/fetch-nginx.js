
/**
 * Convert these text files to JSON for browser usage.
 */

global.Promise = global.Promise || require('bluebird')

var co = require('co')
var fs = require('fs')
var cogent = require('cogent')
var writedb = require('./lib/write-db')

/**
 * Mime types and associated extensions are stored in the form:
 *
 *   <type> <ext> <ext> <ext>;
 */
var typeLineRegExp = /^\s*([\w-]+\/[\w\+\.-]+)((?:\s+[\w-]+)*);\s*$/gm

co(function* () {
  var url = 'http://hg.nginx.org/nginx/raw-file/default/conf/mime.types'
  var res = yield* cogent(url, {
    string: true
  })

  if (res.statusCode !== 200) {
    throw new Error('got status code ' + res.statusCode + ' from ' + url)
  }

  var json = {}
  var match = null

  typeLineRegExp.index = 0

  while (match = typeLineRegExp.exec(res.text)) {
    var mime = match[1]

    // parse the extensions
    var extensions = (match[2] || '')
      .split(/\s+/)
      .filter(Boolean)
    var data = json[mime] || (json[mime] = {})

    // append the extensions
    appendExtensions(data, extensions)
  }

  writedb('src/nginx.json', json)
}).then()

/**
 * Append an extension to an object.
 */
function appendExtension(obj, extension) {
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
function appendExtensions(obj, extensions) {
  if (extensions.length === 0) {
    return
  }

  for (var i = 0; i < extensions.length; i++) {
    var extension = extensions[i]

    // add extension to the type entry
    appendExtension(obj, extension)
  }
}
