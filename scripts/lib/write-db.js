
var fs = require('fs')

module.exports = function writeDatabaseSync(fileName, obj) {
  var fd = fs.openSync(fileName, 'w')
  var keys = Object.keys(obj).sort()

  fs.writeSync(fd, '{\n');

  keys.forEach(function (key, i, arr) {
    fs.writeSync(fd, '  ' + JSON.stringify(key) + ': {\n');

    var end = endLine.apply(this, arguments)
    var data = obj[key]
    var keys = Object.keys(data).sort(sortDataKeys)

    keys.forEach(function (key, i, arr) {
      var end = endLine.apply(this, arguments)
      var val = key === 'extensions'
        ? data[key].slice().sort()
        : data[key]
      fs.writeSync(fd, '    ' + JSON.stringify(key) + ': ' + JSON.stringify(val) + end);
    })

    fs.writeSync(fd, '  }' + end);
  })

  fs.writeSync(fd, '}\n');

  fs.closeSync(fd);
};

function endLine(key, i, arr) {
  var comma = i + 1 === arr.length
    ? ''
    : ','
  return comma + '\n'
}

function sortDataKeys(a, b) {
  var cmp = a.localeCompare(b)

  return a !== 'source' || !cmp
    ? cmp
    : -1
}
