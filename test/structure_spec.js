/* global describe it beforeEach */
var assert = require('assert')
var structure = require('../lib/structure')
var gather = require('../lib/gather')
var path = require('path')
var _ = require('underscore')

describe('The structure module', function () {
  it('.isRelativeLink("http://bla.com") === false', function () {
    assert.equal(structure.isRelativeLink('http://bla.com'), false)
  })

  it('.isRelativeLink("https://bla.com/asd") === false', function () {
    assert.equal(structure.isRelativeLink('https://bla.com/asd'), false)
  })

  it('.isRelativeLink("//bla.com/123") === false', function () {
    assert.equal(structure.isRelativeLink('//bla.com/123'), false)
  })

  it('.isRelativeLink("/bla") === true', function () {
    assert.equal(structure.isRelativeLink('/bla'), true)
  })

  it('.isRelativeLink("./bla") === true', function () {
    assert.equal(structure.isRelativeLink('./bla'), true)
  })

  it('addUrlToDoclets()', function () {
    var fakeDoclets = [{
      meta: {
        filename: 'lib/foo.js',
        lineno: 15
      }
    }]
    structure.addUrlToDoclets(fakeDoclets, 'http://github.com/lipp/node-jet', 'v1.0.0')
    assert.equal(fakeDoclets[0].meta.url, 'http://github.com/lipp/node-jet/blob/v1.0.0/lib/foo.js#L15')
  })

  it('isPublic()', function () {
    assert.equal(structure.isPublic({}), true)
    assert.equal(structure.isPublic({
      access: 'public'
    }), true)
    assert.equal(structure.isPublic({
      access: 'private'
    }), false)
    assert.equal(structure.isPublic({
      access: 'protected'
    }), false)
    assert.equal(structure.isPublic({
      tags: [{
        title: 'api',
        value: 'public'
      }]
    }), true)
    assert.equal(structure.isPublic({
      tags: [{
        title: 'bla',
        value: 'public'
      }]
    }), true)
    assert.equal(structure.isPublic({
      tags: [{
        title: 'api',
        value: 'private'
      }]
    }), false)
    assert.equal(structure.isPublic({
      tags: [{
        title: 'api',
        value: 'protected'
      }]
    }), false)
  })

  it('createMarkdownRenderer', function () {
    var renderer = structure.createMarkdownRenderer('http://github.com/lipp/node-jet', 'master')
    var html = renderer('[about](/about.html)')
    assert(html.indexOf('<a href="http://github.com/lipp/node-jet/blob/master/about.html">about</a>') > -1)
    html = renderer('![Alt text](/path/to/img.jpg)')
    assert(html.indexOf('<img src="http://github.com/lipp/node-jet/raw/master/path/to/img.jpg" alt="Alt text">') > -1)
  })

  describe('the ignore fixture doclets', function () {
    var doclets
    beforeEach(function () {
      var dir = path.join(__dirname, '../fixtures/ignore')
      var data = gather.gatherDocletsAndMeta(dir, true)
      doclets = data.doclets
    })

    it('should have length 7 ', function () {
      assert.equal(doclets.length, 7)
    })

    it('rejecting all isIgnored gives 1 doclet ', function () {
      var notIgnored = _.reject(doclets, structure.isIgnored(doclets))
      assert.equal(notIgnored.length, 2)
      assert(_.findWhere(notIgnored, {longname: 'Bar'}))
      assert(_.findWhere(notIgnored, {longname: 'Bar#setY'}))
    })
  })
})
