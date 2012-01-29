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

exports.Assert = Assert
exports['test read fixtures'] = function(expect, complete) {
  var content = 'xyz\n'
  var stream = fs.read(path.join(root, 'x.txt'), {
    encoding: 'utf-8',
    length: content.length
  })

  expect(stream).to.be('xyz\n').then(complete)
}

exports['test read in buffers'] = function(expect, complete) {
  var stream = fs.read(path.join(root, 'x.txt'))
  var streamContent = streamer.map(function(buffer) {
    return { isBuffer: Buffer.isBuffer(buffer), string: buffer.toString() }
  }, stream)

  expect(streamContent).items.to.be({
    isBuffer: true,
    string: 'xyz\n'
  }).then(complete)
}

exports['test encoding binary streams buffers'] = function(expect, complete) {
  var stream = fs.read(path.join(root, 'x.txt'), { encoding: 'binary' })
  var streamContent = streamer.map(function(buffer) {
    return { isBuffer: Buffer.isBuffer(buffer), string: buffer.toString() }
  }, stream)

  expect(streamContent).items.to.be({
    isBuffer: true,
    string: 'xyz\n'
  }).then(complete)
}

exports['test read in chuncks'] = function(expect, complete) {
  var stream = fs.read(path.join(root, 'x.txt'), {
    encoding: 'utf-8',
    size: 2
  })

  expect(stream).items.to.be('xy', 'z\n').then(complete)
}

exports['test read with offset'] = function(expect, complete) {
  var stream = fs.read(path.join(root, 'x.txt'), {
    encoding: 'utf-8',
    size: 2,
    start: 1
  })

  expect(stream).to.be('yz', '\n').then(complete)
}

exports['test read till'] = function(expect, complete) {
  var stream = streamer.map(String, fs.read(path.join(root, 'x.txt'), {
    start: 1,
    size: 1,
    end: 3
  }))

  expect(stream).items.to.be('y', 'z').and.then(complete)
}

exports['test read unexistning'] = function(expect, complete) {
  var stream = fs.read(path.join(root, 'does_not_exist'))

  expect(stream).to.stop.with.an.error(/ENOENT/).and.then(complete)
}

exports['test read unicode'] = function(expect, complete) {
  var expected = []
  for (var i = 10000; --i >= 0;) expected[i] = '\u2026'
  var stream = streamer.map(String, fs.read(path.join(root, 'elipses.txt')))

  expect(stream).items.to.be(expected.join('')).then(complete)
}

exports['test read empty'] = function(expect, complete) {
  var stream = fs.read(path.join(root, 'empty.txt'))

  expect(stream).to.be.empty().then(complete)
}

if (module == require.main)
  require("test").run(exports);

});
