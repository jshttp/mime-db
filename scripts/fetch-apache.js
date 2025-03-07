/*!
 * mime-db
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015-2023 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Convert these text files to JSON for browser usage.
 */

var writedb = require('./lib/write-db')
var { request } = require('./lib/request')

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
var TYPE_LINE_REGEXP = /^(?:# )?([\w-]+\/[\w+.-]+)((?:\s+[\w-]+)*)$/gm

/**
 * URL for the mime.types file in the Apache HTTPD project source.
 */
var URL = 'https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types'

;(async function () {
  const res = await request(URL)

  var json = {}
  var match = null
  var body = await res.body.text()

  TYPE_LINE_REGEXP.index = 0

  while ((match = TYPE_LINE_REGEXP.exec(body))) {
    var mime = match[1]

    if (mime.slice(-8) === '/example') {
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
}())

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
