/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: false latedef: false */
/*global define: true */

!(typeof(define) !== "function" ? function($){ $(typeof(require) !== 'function' ? (function() { throw Error('require unsupported'); }) : require, typeof(exports) === 'undefined' ? this : exports); } : define)(function(require, exports) {

'use strict';

var fs = require('fs')
var binding = process.binding('fs')
var streamer = require('streamer/core'), Stream = streamer.Stream

var call = Function.prototype.call
// Convenience shortcut for Array.prototype.slice.call(args, n)
var slice = call.bind(Array.prototype.slice)

var node = {
  future: function future(f) {
    var deferred = streamer.defer()
    f.apply(this, slice(arguments, 1).concat(function callback(error) {
      if (error) deferred.reject(error)
      else deferred.resolve(slice(arguments, 1))
    }))
    return deferred.promise
  },
  apply: function apply(f, promise) {
    return streamer.promise(promise).then(function(array) {
      return f.apply(f, array)
    })
  },
  join: function(promises) {
    return slice(promises).map(streamer.promise).reduce(function(items, item) {
      return items.then(function(items) {
        return item.then(function(item) {
          return items.concat(item)
        })
      })
    }, streamer.promise([]))
  },
  call: function call(f, arg1, arg2, arg3) {
    return node.apply(f, node.join(slice(arguments, 1)))
  }
}

node.future.lazy = function lazy(f) {
  var result, args = slice(arguments)
  return { then: function then(resolve, reject) {
    result = result || node.future.apply(node.future, args)
    return result.then(resolve, reject)
  }}
}

function identity(value) { return value }

exports.decoder = decoder
function decoder(encoding) {
  return encoding === 'binary' ? identity : function decode(buffer) {
    return buffer.toString(encoding)
  }
}

exports.stat = stat
function stat(path) {
  return ((streamer.run)
    (node.future.lazy, binding.stat, path)
    (node.apply, function onstat(stats) {
      return Stream(Object.create(stats, {
        path: { value: path, enumerable: true }
      }))
    }))
}

exports.list = list
function list(path) {
  return ((streamer.run)
    (node.future.lazy, binding.readdir, path)
    (node.apply, Stream.from))
}

function remove(path) {
  return ((streamer.run)
    (node.future.lazy, binding.unlink, path)
    (node.apply, Stream.of))
}
exports.remove = remove

exports.makeDirectory = makeDirectory
function makeDirectory(path, options) {
  var mode = options && options.mode
  var deferred = streamer.defer()
  binding.mkdir(path, mode, function made(error) {
    if (error) deferred.reject(error)
    else deferred.resolve(Stream.empty)
  })
  return deferred.promise
}

exports.removeDirectory = removeDirectory
function removeDirectory(path) {
  var deferred = streamer.defer()
  binding.rmdir(path, function removed(error) {
    if (error) deferred.reject(error)
    else deferred.resolve(Stream.empty)
  })
  return deferred.promise
}

exports.open = open
function open(path, options) {
  var flags = options && options.flags || 'r'
  var mode =  options && options.mode || '0666'
  return streamer.future.lazy(function() {
    var deferred = streamer.defer()
    fs.open(path, flags, mode, function opened(error, fd) {
      if (error) deferred.reject(error)
      else deferred.resolve(Stream(fd))
    })
    return deferred.promise
  })
}

exports.close = close
function close(stream) {
  /**
  Takes file descriptor and returns stream that closes given descriptor on
  stream consumption and either propagates close error to the consumer or
  reaches end.
  **/
  return streamer.flatten(streamer.map(function(fd) {
    var deferred = streamer.defer()
    binding.close(fd, function closed(error) {
      if (error) deferred.reject(error)
      else deferred.resolve(Stream.empty)
    })
    return deferred.promise
  }, stream))
}

exports.reader = reader
function reader(fd, options) {
  /**
  Takes file descriptor and (optional) options object that may contain
  `size` per chunk, start position to start read form and end position
  to read to.
  **/
  options = options || {}
  var size = options.size || 64 * 1024
  var start = options.start || 0
  var end = options.end || Infinity
  if (end <= start) return Stream.empty

  var buffer = Buffer(size)
  var deferred = streamer.defer()
  binding.read(fd, buffer, 0, size, start, function read(error, count) {
    if (error) deferred.reject(error)
    else if (count === 0) deferred.resolve(Stream.empty)
    else deferred.resolve(Stream(buffer.slice(0, count), function rest() {
      return reader(fd, {
        size: size,
        start: start + count,
        end: end
      })
    }))
  })
  return deferred.promise
}

exports.read = read
function read(path, options) {
  /**
  Returns stream of contents of the file under the given `path`. Optional
  `options` object may be used to configure reading in further details. By
  default file will be open with an `'r'` flag and `'0666'` mode, alternatively
  `options.flags` and `options.mode` strings may be used to override those
  defaults. By default complete file is read, but `options.start` and
  `options.end` integers may be passed to read out just a given range. Stream
  items are buffers of content, size of those chunks may be configured via
  `options.size` option.
  **/
  options = options || {}
  options.encoding = options.encoding || 'binary'
  options.flags = options.flags || 'r'
  var file = typeof(path) === 'string' ? open(path, options) : path
  var content = ((streamer.run.on)
    (file)
    (streamer.head)
    (streamer.map, function opened(fd) { return reader(fd, options) })
    (streamer.flatten)
    (streamer.map, decoder(options.encoding)))

  content.file = file
  return content
}

exports.writter = writter
function writter(fd, content, options) {
  var start = options.start || 0
  var encoding = options.encoding || 'utf-8'
  return streamer.edit(function(stream) {
    var data = Buffer.isBuffer(stream.head) ? stream.head
                                            : new Buffer(stream.head, encoding)

    if (!data.length) return writter(fd, stream.tail, options)

    var deferred = streamer.defer()
    binding.write(fd, data, 0, data.length, start, function wrote(error, count) {
      if (error) return deferred.reject(error)
      deferred.resolve(Stream(count, writter(fd, stream.tail, {
        start: start + count,
        encoding: encoding
      })))
    })
    return deferred.promise
  }, content)
}

exports.write = write
function write(path, source, options) {
  /**
  Writes content from the given `source` stream to a file under the given
  `path`.  Optional `options` object may be used to configure writing in
  further details. By default file will be open with an `'w'` flag and `'0666'`
  mode, alternatively `options.flags` and `options.mode` strings may be used to
  override those defaults. By default file is written from the begining, but
  this could be overridden via `options.start`. As result stream of 0 items
  is returned, which will end once write is complete. All errors will propagate
  to a resulting stream.
  **/
  options = options || {}
  options.flags = options.flags || 'w'
  var file = typeof(path) === 'string' ? open(path, options) : path
  var result = ((streamer.run.on)
    (file)
    (streamer.head)
    (streamer.map, function opened(fd) {
      return writter(fd, source, options)
    })
    (streamer.flatten)
    (streamer.reduce, function(x, y) { return x + y }, 0))

  result.file = file

  return result
}

});
