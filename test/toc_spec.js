var assert = require('assert');
var toc = require('../lib/toc');
var fs = require('fs');
var sinon = require('sinon');

describe('The toc module', function () {
	it('.add(...) some stuff', function () {
		assert.doesNotThrow(function () {
			toc.add('http://bla.com', 'master', 1);
			toc.add('http://bla.com', 'v1.0.1', 2);
			toc.add('http://bla.com', 'master', 4); // should overwrite 1
			toc.add('http://asd.com', 'master', 3);
		});
		assert.doesNotThrow(function () {
			fs.statSync('./toc.json');
		});
	});

	it('.load(each) calls each for every entry', function () {
		var eachSpy = sinon.spy();
		toc.load(eachSpy);
		assert(eachSpy.calledWith('http://bla.com', 'master', 4));
		assert(eachSpy.calledWith('http://bla.com', 'v1.0.1', 2));
		assert(eachSpy.calledWith('http://asd.com', 'master', 3));
		assert.equal(eachSpy.callCount, 3);
	});
});