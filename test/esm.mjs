import assert from "node:assert"
import { readdirSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import test from 'node:test';

import typer from "media-typer"

import db from  "../index.mjs"

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const path = resolve(__dirname, '..', 'src')
const types = []

test("should not contain types not in src", async () => {
  // collect all source types
  for (const file of readdirSync(path)) {
    if (!/-types\.json$/.test(file)) continue

    const imported = await import(resolve(path, file), {
      assert: {
        type: "json"
      }
    })
    types.push(...Object.keys(imported.default))
  }

  Object.keys(db).forEach((name) => {
    assert.ok(types.includes(name), `type ${name} should be in src/`)
  })
})

test("should contain only valid mime types", () => {
  Object.keys(db).forEach((mime) => {
    assert.ok(typer.test(mime), `type ${mime} is a valid mime type`)
  })
})

test("should not have any uppercased letters in names", () => {
  Object.keys(db).forEach((name) => {
    assert.strictEqual(name, name.toLowerCase(), `type ${name} should be lowercase`)
  })
})

test("should have .json and .js as having UTF-8 charsets", () => {
  assert.strictEqual('UTF-8', db['application/json'].charset)
  assert.strictEqual('UTF-8', db['application/javascript'].charset)
})

test("should set audio/x-flac with extension=flac", () => {
  assert.strictEqual('flac', db['audio/x-flac'].extensions[0], 'should set audio/x-flac with extension=flac')
})

test("should have guessed application/mathml+xml", () => {
  assert(db['application/mathml+xml'])
})

test("should not have an empty .extensions", () => {
  assert(Object.keys(db).every((name) => {
    var mime = db[name]
    if (!mime.extensions) return true
    return mime.extensions.length
  }))
})

test("should have only lowercase .extensions", () => {
  Object.keys(db).forEach((name) => {
    (db[name].extensions || []).forEach((ext) => {
      assert.strictEqual(ext, ext.toLowerCase(), `extension ${ext} in type ${name} should be lowercase`)
    })
  })
})

test("should have the default .extension as the first", () => {
  assert.strictEqual(db['text/plain'].extensions[0], 'txt')
  assert.strictEqual(db['video/x-matroska'].extensions[0], 'mkv')
})
