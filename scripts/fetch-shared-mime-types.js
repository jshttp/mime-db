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

const { XMLParser } = require('fast-xml-parser');
var got = require('got')
var writedb = require('./lib/write-db')

/**
 * shared-mime-types uses glob patterns to match filenames, only some of which
 * can be treated as literal extension checks.
 * For example, we must skip globs like "*.ps.bz2" (multi-part extension) or
 * "*.so.[0-9]*" (complex glob).
 */
const USABLE_GLOB_REGEXP = /^\*\.([A-Za-z0-9]+)$/;

/**
 * URL for the freedesktop.org.xml.in file in the shared-mime-info project source.
 */
var URL = 'https://gitlab.freedesktop.org/xdg/shared-mime-info/-/raw/master/data/freedesktop.org.xml.in?ref_type=heads'

;(async function () {
  const res = await got(URL, {headers: {'User-Agent': 'curl/7.47.0'}})
  const parser = new XMLParser({ignoreAttributes: false});
  const result = parser.parse(res.body);
  const json = Object.fromEntries(
    result["mime-info"]["mime-type"].map(extract).filter(acceptable)
  );
  writedb('src/shared-mime-types.json', json);
}())

/**
 * Extract the required details from a mime-type element.
 */
function extract (obj) {
  const type = obj["@_type"];
  const globs = obj["glob"];
  let exts;
  if (globs instanceof Array) {
    exts = globs.flatMap(globToExt);
  } else if (globs instanceof Object) {
    exts = globToExt(globs);
  } else {
    exts = [];
  }
  return [type, exts.length ? {"extensions": exts} : {}];
}

/**
 * Extract the extension from a glob element, if possible.
 */
function globToExt (obj) {
  const pattern = obj["@_pattern"] || "";
  const match = USABLE_GLOB_REGEXP.exec(pattern);
  if (match) {
    return [match[1]];
  } else {
    return [];
  }
}

/**
 * Predicate to filter out some non-conventional types.
 */
function acceptable ([type, details]) {
  // Blocklist rather than allowlist so any exclusions from upstream are deliberate
  return !(type.startsWith("inode/") || type.startsWith("x-"));
}
