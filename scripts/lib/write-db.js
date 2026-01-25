/*!
 * mime-db
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015-2022 Douglas Christopher Wilson
 * MIT Licensed
 */

var fs = require('fs')

module.exports = function writeDatabaseSync (fileName, obj) {
  var keys = Object.keys(obj).sort()
  var parts = ['{\n']

  keys.forEach(function (key, i, arr) {
    var end = endLine.apply(this, arguments)
    var data = obj[key]
    var keys = Object.keys(data).sort(sortDataKeys)

    parts.push('  ', JSON.stringify(key), ': {')

    if (keys.length === 0) {
      parts.push('}', end)
      return
    }

    parts.push('\n')
    keys.forEach(function (key, i, arr) {
      var end = endLine.apply(this, arguments)
      var val = data[key]

      if (val !== undefined) {
        var str = Array.isArray(val) && val.some(function (v) { return String(v).length > 15 })
          ? JSON.stringify(val, null, 2).split('\n').join('\n    ')
          : JSON.stringify(val)

        parts.push('    ', JSON.stringify(key), ': ', str, end)
      }
    })

    parts.push('  }', end)
  })

  parts.push('}\n')

  fs.writeFileSync(fileName, parts.join(''))
}

function endLine (key, i, arr) {
  var comma = i + 1 === arr.length
    ? ''
    : ','
  return comma + '\n'
}

function sortDataKeys (a, b) {
  var cmp = a.localeCompare(b)

  return cmp && (a === 'source' || b === 'source')
    ? (a === 'source' ? -1 : 1)
    : cmp
}
