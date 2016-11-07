
/**
 * Convert these text files to JSON for browser usage.
 */

global.Promise = global.Promise || loadBluebird()

var co = require('co')
var cogent = require('cogent')
var writedb = require('./lib/write-db')

/**
 * Mime types and associated extensions are stored in the form:
 *
 *   <type> <ext> <ext> <ext>
 *
 * And some are commented out with a leading `#` because they have no associated extensions.
 * This regexp checks whether a single line matches this format, ignoring lines that are just comments.
 * We could also just remove all lines that start with `#` if we want to make the JSON files smaller
 * and ignore all mime types without associated extensions.
 */
var typeLineRegExp = /^(?:# )?([\w-]+\/[\w+.-]+)((?:\s+[\w-]+)*)$/gm

co(function* () {
  var url = 'http://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types'
  var res = yield * cogent(url, {
    string: true
  })

  if (res.statusCode !== 200) {
    throw new Error('got status code ' + res.statusCode + ' from ' + url)
  }

  var json = {}
  var match = null

  typeLineRegExp.index = 0

  while ((match = typeLineRegExp.exec(res.text))) {
    var mime = match[1]

    if (mime.substr(-8) === '/example') {
      continue
    }

    // parse the extensions
    var extensions = (match[2] || '')
      .split(/\s+/)
      .filter(Boolean)
    var data = json[mime] || (json[mime] = {})

    // append the extensions
    appendExtensions(data, extensions)
  }

  writedb('src/apache-types.json', json)
}).then()

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
  if (extensions.length === 0) {
    return
  }

  for (var i = 0; i < extensions.length; i++) {
    var extension = extensions[i]

    // add extension to the type entry
    appendExtension(obj, extension)
  }
}

/**
 * Load the Bluebird promise.
 */
function loadBluebird () {
  var Promise = require('bluebird')

  // Silence all warnings
  Promise.config({
    warnings: false
  })

  return Promise
}
