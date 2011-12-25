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

exports['test write in base64'] = function(expect, complete) {
  var file = path.join(root, 'test.jpg')
  var data = [
    '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcH',
    'Bw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/',
    '2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4e',
    'Hh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAAQABADASIAAhEBAxEB/8QA',
    'HwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUF',
    'BAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkK',
    'FhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1',
    'dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXG',
    'x8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEB',
    'AQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAEC',
    'AxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRom',
    'JygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOE',
    'hYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU',
    '1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDhfBUFl/wk',
    'OmPqKJJZw3aiZFBw4z93jnkkc9u9dj8XLfSI/EBt7DTo7ea2Ox5YXVo5FC7g',
    'Tjq24nJPXNVtO0KATRvNHCIg3zoWJWQHqp+o4pun+EtJ0zxBq8mnLJa2d1L5',
    '0NvnKRjJBUE5PAx3NYxxUY0pRtvYHSc5Ka2X9d7H/9k='
  ].join('\n')

  var writeStream = fs.write(file, streamer.list(data), { encoding: 'base64' })
  var readStream = fs.read(file, { encoding: 'base64' })

  expect(writeStream).to.be.empty()
  expect(readStream).elements.to.be(data.replace(/\n/g, ''))
  expect(fs.remove(file)).to.be.empty().and.then(complete)
}

exports['test write mode'] = function(expect, complete) {
  var content = 'ümlaut.'
  var file = path.join(root, 'write-mode.txt')
  var stream = fs.write(file, streamer.list('', content, ''), {
    mode: '0644',
    encoding: 'utf-8'
  })

  expect(stream).to.be.empty()
  expect(fs.read(file, { encoding: 'utf8' })).to.be(content)
  expect(fs.remove(file)).to.be.empty().then(complete)
}

exports['test pipe write'] = function(expect, complete) {
  var sourceFile = path.join(root, 'y.txt')
  var targetFile = path.join(root, 'piped.txt')
  var source = fs.read(sourceFile, { size: 7 })
  var target = fs.read(targetFile, { encoding: 'utf-8'})
  var pipe = fs.write(targetFile, source)

  expect(target).to.have.an.error(/ENOENT/)
  expect(pipe).to.be.empty()
  expect(target).to.be('Hello streamer! How is life? Does all your tests pass?')
  expect(fs.remove(targetFile)).to.be.empty().and.then(complete)
}

if (module == require.main)
  require("test").run(exports);

});
