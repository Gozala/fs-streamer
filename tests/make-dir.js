/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: false latedef: false */
/*global define: true */

!(typeof(define) !== "function" ? function($){ $(typeof(require) !== 'function' ? (function() { throw Error('require unsupported'); }) : require, typeof(exports) === 'undefined' ? this : exports); } : define)(function(require, exports) {

'use strict';

var fs = require('../fs')
var streamer = require('streamer'), Stream = streamer.Stream
var path = require('path')
var root = path.join(path.dirname(module.filename), './fixtures/')
var Assert = require('./assert').Assert

exports.Assert = Assert

exports['test make directory'] = function(expect, complete) {
  var file = path.join(root, 'make-dir')
  function make(file) { return fs.makeDirectory(file) }
  function stat(path) {
    return streamer.map(function(stat) {
      return { path: stat.path, isDir: stat.isDirectory() }
    }, fs.stat(path))
  }

  expect(make(file)).to.be.empty()
  expect(stat(file)).to.be({
    path: file,
    isDir: true,
  })
  expect(fs.removeDirectory(file)).to.be.empty().then(complete)
}

exports['test can not make if exists'] = function(expect, complete) {
  var file = path.join(root, 'remake-dir')
  function make(file) { return fs.makeDirectory(file) }

  expect(make(file)).to.be.empty()
  expect(make(file)).to.have.an.error(/EXIST/)
  expect(fs.removeDirectory(file)).to.be.empty().then(complete)
}

exports['test make with modes'] = function(expect, complete) {
  var file = path.join(root, 'make-mode-dir')
  function make(file, mode) { return fs.makeDirectory(file, mode) }

  expect(make(file, { mode: parseInt('0766', 8) })).to.be.empty()
  expect(fs.removeDirectory(file)).to.be.empty()
  expect(make(file, {})).to.be.empty()
  expect(fs.removeDirectory(file)).to.be.empty()
  expect(make(file, { mode: 't' })).to.have.error(/argument/).then(complete)
}

if (module == require.main)
  require("test").run(exports);

});
