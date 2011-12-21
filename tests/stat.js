/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: false latedef: false */
/*global define: true */

!(typeof(define) !== "function" ? function($){ $(typeof(require) !== 'function' ? (function() { throw Error('require unsupported'); }) : require, typeof(exports) === 'undefined' ? this : exports); } : define)(function(require, exports) {

'use strict';

var fs = require('../fs')
var streamer = require('streamer')
var path = require('path')
var root = path.join(path.dirname(module.filename), './fixtures/stat/')
var test = require('./test-utils').test

function expectations(stat) {
  return {
    isDirectory: stat.isDirectory(),
    isFile: stat.isFile(),
    mtime: stat.mtime instanceof Date
  }
}

exports['test stat pwd'] = function(assert, done) {
  var expected = [{ isDirectory: true, isFile: false, mtime: true }]
  var actual = streamer.map(expectations, fs.stat('.'));

  test(assert, actual, expected, 'pwd stat')(done)
}

exports['test stat file'] = function(assert, done) {
  var expected = [{ isDirectory: false, isFile: true, mtime: true }]
  var actual = streamer.map(expectations, fs.stat(path.join(root, 'x.txt')))

  test(assert, actual, expected, 'existing file stat')(done)
}

exports['test stat non-existing'] = function(assert, done) {
  var expected = { error: /ENOENT/, elements: [] }
  var actual = fs.stat(path.join(root, 'does_not_exist'))

  test(assert, actual, expected, 'file does not exists')(done)
}

if (module == require.main)
  require("test").run(exports);

});
