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

function test(file) {
  return streamer.map(function(item) { return !!item }, file)
}

exports['test open for read non-existing'] = function(expect, complete) {
  var file = path.join(root, 'does-not-exists')

  expect(fs.open(file)).to.have.an.error(/ENOENT/).then(complete)
}

exports['test open for write non-existing'] = function(expect, complete) {
  var file = path.join(root, 'open-for-write')
  var actual = fs.open(file, { flags: 'w' })

  expect(test(actual)).to.be(true)
  expect(fs.close(actual)).to.be.empty()
  expect(fs.remove(file)).to.be.empty().then(complete)
}

exports['test on two opens'] = function(expect, complete) {
  var file = path.join(root, 'x.txt'), fds = []
  function push(fd) { fds.push(fd); return !!fd }

  var file1 = fs.open(file)
  var file2 = fs.open(file)
  expect(streamer.map(push, file1)).to.be(true)
  expect(streamer.map(push, file2)).to.be(true).then(function(assert) {
    assert.notEqual(fds[0], fds[1], 'created new descriptor on each open')
    expect(fs.close(file1)).to.be.empty()
    expect(fs.close(file2)).to.be.empty().then(complete)
  })
}

exports['test second close fails'] = function(expect, complete) {
  var file = fs.open(path.join(root, 'y.txt'))

  expect(fs.close(file)).to.be.empty()
  expect(fs.close(file)).to.have.error(/EBADF/).then(complete)
}

exports['test open / close file'] = function(expect, complete) {
  var file = path.join(root, 'x.txt'), fds = []
  function push(fd) { fds.push(fd); return !!fd }

  var file1 = fs.open(file)
  expect(streamer.map(push, file1)).to.be(true)
  expect(fs.close(file1)).to.be.empty().then(function(assert) {
    var file2 = fs.open(file)
    expect(streamer.map(push, file2)).to.be(true).then(function(assert) {
      assert.equal(fds[0], fds[1], 'created same descriptor if closed')
      expect(fs.close(file2)).to.be.empty().then(complete)
    })
  })
}

if (module == require.main)
  require("test").run(exports);

});
