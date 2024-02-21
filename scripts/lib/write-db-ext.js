
var fs = require('fs')

module.exports = function writeDatabaseSync (fileName, obj) {
  var fd = fs.openSync(fileName, 'w')
  var keys = Object.keys(obj).sort()

  fs.writeSync(fd, '{\n')

  keys.forEach(function (key, i, arr) {
    var end = endLine.apply(this, arguments)
    var val = obj[key]
    fs.writeSync(fd, '  ' + JSON.stringify(key) + ': ' + JSON.stringify(val) + end)
  })

  fs.writeSync(fd, '}\n')

  fs.closeSync(fd)
}

function endLine (key, i, arr) {
  var comma = i + 1 === arr.length
    ? ''
    : ','
  return comma + '\n'
}
