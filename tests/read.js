/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: false latedef: false */
/*global define: true */

!(typeof(define) !== "function" ? function($){ $(typeof(require) !== 'function' ? (function() { throw Error('require unsupported'); }) : require, typeof(exports) === 'undefined' ? this : exports); } : define)(function(require, exports) {

'use strict';

var fs = require('../fs')
var streamer = require('streamer')
var path = require('path')
var root = path.join(path.dirname(module.filename), './fixtures/read/')
var test = require('./test-utils').test

exports['test read fixtures'] = function(assert, done) {
  var expected = [ 'xyz\n' ]
  var actual = streamer.map(String, fs.read(path.join(root, 'x.txt'), {
    encoding: 'utf-8',
    length: expected.join('').length
  }))

  test(assert, actual, expected, 'read as expected')(done)
}

exports['test read in chuncks'] = function(assert, done) {
  var expected = [ 'xy', 'z\n' ]
  var actual = streamer.map(String, fs.read(path.join(root, 'x.txt'), {
    encoding: 'utf-8',
    size: expected[0].length
  }))

  test(assert, actual, expected, 'read in chuncks of given `size`')(done)
}

exports['test read with offset'] = function(assert, done) {
  var expected = [ 'yz', '\n' ]
  var actual = streamer.map(String, fs.read(path.join(root, 'x.txt'), {
    encoding: 'utf-8',
    size: expected[0].length,
    start: 1
  }))

  test(assert, actual, expected, 'read as from the `start` position')(done)
}

exports['test read till'] = function(assert, done) {
  var expected = [ 'y', 'z' ]
  var actual = streamer.map(String, fs.read(path.join(root, 'x.txt'), {
    start: 1,
    size: 1,
    end: 3
  }))

  test(assert, actual, expected, 'read till `end` position')(done)
}

if (module == require.main)
  require("test").run(exports);

});
