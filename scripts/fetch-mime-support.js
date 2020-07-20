'use strict'
var getMimeTypes = require('./fetch-mime-types-file');

/**
 * URL for the mime.types file in the Apache HTTPD project source.
 */
var URL = 'https://salsa.debian.org/debian/mime-support/-/raw/master/mime.types?inline=false'
var OUT = 'src/mime-support-types.json'

getMimeTypes(URL, OUT, function onResponse (err) {
  console.error(err);
});
