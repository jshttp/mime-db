/*!
 * mime-db
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015-2023 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Convert the IIS static MIME map to JSON for browser usage.
 */

var { request } = require('./lib/request')
var writedb = require('./lib/write-db')

/**
 * IIS stores extension/type mappings in applicationhost.config as:
 *
 *   <mimeMap fileExtension=".ext" mimeType="type/subtype" />
 */
var MIME_MAP_REGEXP = /<mimeMap\s+fileExtension="([^"]+)"\s+mimeType="([^"]+)"\s*\/>/gi

/**
 * Only keep syntactically valid `type/subtype` values.
 */
var VALID_TYPE_REGEXP = /^[\w-]+\/[\w+.-]+$/

/**
 * URL for the default IIS applicationhost.config distributed in the ASP.NET Core
 * source tree. This is a public, actively maintained mirror of the IIS default
 * static content (MIME) map.
 */
var URL = 'https://raw.githubusercontent.com/dotnet/aspnetcore/main/src/Servers/IIS/build/applicationhost.iis.config'

;(async function () {
  const res = await request(URL)

  var json = {}
  var match = null
  var body = await res.body.text()

  MIME_MAP_REGEXP.lastIndex = 0

  while ((match = MIME_MAP_REGEXP.exec(body))) {
    // normalize the extension: drop the leading dot, lowercase
    var extension = match[1].replace(/^\./, '').toLowerCase()
    var mime = match[2].toLowerCase()

    // skip wildcard/empty extensions
    if (!extension || extension.indexOf('*') !== -1) {
      continue
    }

    // skip the generic binary catch-all (IIS maps many unknown extensions to it)
    if (mime === 'application/octet-stream') {
      continue
    }

    // skip anything that is not a valid mime type
    if (!VALID_TYPE_REGEXP.test(mime)) {
      continue
    }

    var data = json[mime] || (json[mime] = {})

    // append the extension
    appendExtension(data, extension)
  }

  writedb('src/iis-types.json', json)
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
