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
exports['test write to file'] = function(assert, complete) {
  var file = path.join(root, 'write.txt')
  var content = '012345678910'

  assert(fs.write(file, streamer.list(content))).to.an.empty()
  assert(streamer.map(String, fs.read(file))).to(content)
  assert(fs.remove(file)).to.an.empty().and.then(complete)
}

exports['test append / overwrite'] = function(expect, complete) {
  var file = path.join(root, 'append-overwrite.txt')

  var fileContent = fs.read(file, { encoding: 'utf-8' })
  var initalWrite = fs.write(file, streamer.list('abcdefghijklmnopqrstuvwxyz'))
  var append = fs.write(file, streamer.list('123456'), {
    start: 10,
    flags: 'r+'
  });
  var overwrite = fs.write(file, streamer.list('\u2026\u2026'), {
    start: 10,
    flags: 'r+'
  });
  var stupidOverwrite = fs.write(file, streamer.list('boom'), {
    start: -5,
    flags: 'r+'
  });

  expect(initalWrite).to.be.empty()
  expect(fileContent).to.be('abcdefghijklmnopqrstuvwxyz')
  expect(append).to.be.empty()
  expect(fileContent).to.be('abcdefghij123456qrstuvwxyz')
  expect(overwrite).to.be.empty()
  expect(fileContent).to.be('abcdefghij\u2026\u2026qrstuvwxyz')
  expect(stupidOverwrite).to.be.empty()
  expect(fileContent).to.be('boomefghij\u2026\u2026qrstuvwxyz')
  expect(fs.remove(file)).to.be.empty().then(complete)
}

exports['test write a lot'] = function(expect, complete) {
  var N = 10240
  var file = path.join(root, 'out.txt')
  var line = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaa\n'

  function content(index) {
    index = index || 0
    return function stream(next) {
      next(line, index < N ? content(index + 1) : streamer.empty)
    }
  }

  expect(fs.write(file, content())).to.be.empty()
  expect(fs.read(file, {
    start: line.length * (N  - 3),
    size: line.length,
    encoding: 'utf-8'
  })).to.be(line, line, line, line)
  expect(fs.remove(file)).to.be.empty().then(complete)
}

if (module == require.main)
  require("test").run(exports);

});
