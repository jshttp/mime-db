
# mime-db

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]
[![Gittip][gittip-image]][gittip-url]

This is a database of all mime types.
It consistents of a single, public JSON file and does not include any logic,
allowing it to remain as unopinionated as possible with an API.
It aggregates data from the following sources:

- http://www.iana.org/assignments/media-types/media-types.xhtml
- http://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types

## Usage

```bash
npm i mime-db
```

```js
var db = require('mime-db');

// grab data on .js files
var data = db['application/javascript'];
```

If you're crazy enough to use this in the browser,
you can just grab the JSON file:

```
https://cdn.rawgit.com/jshttp/mime-db/master/db.json
```

## Data Structure

The JSON file is a map lookup for lowercased mime types.
Each mime type has the following properties:

- `.extensions[]` - known extensions associated with this mime type.
- `.compressible` - whether a file of this type is can be gzipped.
- `.charset` - the default charset associated with this type, if any.

If unknown, every property could be `undefined`.

## Repository Structure

- `scripts` - these are scripts to run to build the database
- `src/` - this is a folder of files created from remote sources like Apache and IANA
- `lib/` - this is a folder of our own custom sources and db, which will be merged into `db.json`
- `db.json` - the final built JSON file for end-user usage

## Contributing

To edit the database, only make PRs against files in the `lib/` folder.
To update the build, run `npm run update` with node `v0.11.13+` (sorry).

[npm-image]: https://img.shields.io/npm/v/mime-db.svg?style=flat-square
[npm-url]: https://npmjs.org/package/mime-db
[github-tag]: http://img.shields.io/github/tag/jshttp/mime-db.svg?style=flat-square
[github-url]: https://github.com/jshttp/mime-db/tags
[travis-image]: https://img.shields.io/travis/jshttp/mime-db.svg?style=flat-square
[travis-url]: https://travis-ci.org/jshttp/mime-db
[coveralls-image]: https://img.shields.io/coveralls/jshttp/mime-db.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/jshttp/mime-db?branch=master
[david-image]: http://img.shields.io/david/jshttp/mime-db.svg?style=flat-square
[david-url]: https://david-dm.org/jshttp/mime-db
[license-image]: http://img.shields.io/npm/l/mime-db.svg?style=flat-square
[license-url]: LICENSE.md
[downloads-image]: http://img.shields.io/npm/dm/mime-db.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/mime-db
[gittip-image]: https://img.shields.io/gittip/jonathanong.svg?style=flat-square
[gittip-url]: https://www.gittip.com/jonathanong/
