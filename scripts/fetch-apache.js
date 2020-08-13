'use strict'
var getMimeTypes = require('./fetch-mime-types-file');

/**
 * URL for the mime.types file in the Apache HTTPD project source.
 */
var URL = 'https://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types'
var OUT = 'src/apache-types.json'

getMimeTypes(URL, OUT, function onResponse (err) {
  console.error(err);
});
