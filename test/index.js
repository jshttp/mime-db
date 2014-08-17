
var assert = require('assert')

var db = require('..')

describe('mime-db', function () {
  it('should all be mime types', function () {
    assert(Object.keys(db).every(function (name) {
      return ~name.indexOf('/') || console.log(name)
    }))
  })

  it('should not have any uppercased letters in names', function () {
    assert(Object.keys(db).every(function (name) {
      return name === name.toLowerCase()
    }))
  })

  it('should have .json and .js as having UTF-8 charsets', function () {
    assert.equal('UTF-8', db['application/json'].charset)
    assert.equal('UTF-8', db['application/javascript'].charset)
  })

  it('should set audio/x-flac with extension=flac', function () {
    assert.equal('flac', db['audio/x-flac'].extensions[0])
  })

  it('should have guessed application/mathml+xml', function () {
    // because it doesn't have a "template"
    assert(db['application/mathml+xml'])
  })

  it('should have guessed text/plain with charset=UTF-8', function () {
    assert.equal('UTF-8', db['text/plain'].charset)
  })

  it('should not have an empty .extensions', function () {
    assert(Object.keys(db).every(function (name) {
      var mime = db[name]
      if (!mime.extensions) return true
      return mime.extensions.length
    }))
  })
})
