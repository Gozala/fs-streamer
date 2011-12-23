/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: false latedef: false */
/*global define: true */

!(typeof(define) !== "function" ? function($){ $(typeof(require) !== 'function' ? (function() { throw Error('require unsupported'); }) : require, typeof(exports) === 'undefined' ? this : exports); } : define)(function(require, exports) {

'use strict';

var fs = require('../fs')
var streamer = require('streamer')
var path = require('path')
var root = path.join(path.dirname(module.filename), './fixtures/')
var Assert = require('./assert').Assert

function expectations(stat) {
  return {
    isDirectory: stat.isDirectory(),
    isFile: stat.isFile(),
    mtime: stat.mtime instanceof Date
  }
}

exports.Assert = Assert
exports['test stat pwd'] = function(expect, complete) {
  var expected = [{ isDirectory: true, isFile: false, mtime: true }]
  var actual = streamer.map(expectations, fs.stat('.'));

  expect(streamer.map(expectations, fs.stat('.'))).to.be({
    isDirectory: true,
    isFile: false,
    mtime: true
  }).and.then(complete)
}

exports['test stat file'] = function(expect, complete) {
  var stat = streamer.map(expectations, fs.stat(path.join(root, 'x.txt')))

  expect(stat).to.be({
    isDirectory: false,
    isFile: true,
    mtime: true
  }).and.then(complete)
}

exports['test stat non-existing'] = function(expect, complete) {
  var stream = fs.stat(path.join(root, 'does_not_exist'))
  expect(stream).to.have.an.error.matching(/ENOENT/).then(complete)
}

if (module == require.main)
  require("test").run(exports);

});
