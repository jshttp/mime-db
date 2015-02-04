
/**
 * Convert these text files to JSON for browser usage.
 */

var co = require('co')
var fs = require('fs')
var cogent = require('cogent')
var writedb = require('./lib/write-db')

co(function* () {
  yield [
    get('apache', 'http://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types')
  ]
}).then()

function* get(name, url) {
  var res = yield* cogent(url, {
    string: true
  })

  if (res.statusCode !== 200)
    throw new Error('got status code ' + res.statusCode + ' from ' + url)

  var text = res.text
  var json = {}
  // http://en.wikipedia.org/wiki/Internet_media_type#Naming
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
  var re = /^(?:# )?([\w-]+\/[\w\+\.-]+)(?:\s+\w+)*$/
  text = text.split('\n')
  .filter(Boolean)
  .forEach(function (line) {
    line = line.trim()
    if (!line) return
    var match = re.exec(line)
    if (!match) return
    var mime = match[1]
    if (mime.substr(-8) === '/example') return
    // remove the leading # and <type> and return all the <ext>s
    var extensions = line.replace(/^(?:# )?([\w-]+\/[\w\+\.-]+)/, '')
      .split(/\s+/)
      .filter(Boolean)
    var o = json[mime] = {}
    if (extensions.length) o.extensions = extensions
  })
  writedb('src/' + name + '.json', json)
}
