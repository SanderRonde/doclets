/* global describe it before beforeEach afterEach */
var assert = require('assert')
var Routes = require('../lib/routes').Routes
var sinon = require('sinon')
var Repo = require('../lib/models/repo')
var Doclet = require('../lib/models/doclet')
var User = require('../lib/models/user')
var _ = require('underscore')

describe('The routes module', function () {
  var routes
  var sandbox

  before(function () {
    routes = new Routes()
  })

  beforeEach(function () {
    sandbox = sinon.sandbox.create()
  })

  afterEach(function () {
    sandbox.restore()
  })

  it('.authGithub()', function () {
    routes.authGithub()
  })

  it('.authGithubCallback(req, res) saves session and redirects to /', function () {
    var saveCalled
    var req = {
      session: {
        save: function (done) {
          saveCalled = true
          done()
        }
      }
    }
    var res = {}
    res.redirect = sinon.spy()
    routes.authGithubCallback(req, res)
    assert.equal(saveCalled, true)
    assert(res.redirect.calledWith('/'))
  })

  it('.logout(req, res) destroys session and redirects to /', function () {
    var destroyCalled
    var req = {
      session: {
        destroy: function (done) {
          destroyCalled = true
          done()
        }
      }
    }
    var res = {}
    res.redirect = sinon.spy()
    routes.logout(req, res)
    assert.equal(destroyCalled, true)
    assert(res.redirect.calledWith('/'))
  })

  it('.ensureAuthenticated(req, res, next) calls next if authenticated', function () {
    var next = sinon.spy()
    var req = {
      isAuthenticated: function () {
        return true
      }
    }
    routes.ensureAuthenticated(req, null, next)
    assert(next.called)
  })

  it('.ensureAuthenticated(req, res, next) calls res.redirect("/login") if not authenticated', function () {
    var next = sinon.spy()
    var req = {
      isAuthenticated: function () {
        return false
      }
    }
    var res = {
      redirect: sinon.spy()
    }
    routes.ensureAuthenticated(req, res, next)
    assert.equal(next.called, false)
    assert(res.redirect.calledWith('/login'))
  })

  it('.account(req, res) calls Repo.findByUser and res.render("account.jade")', function () {
    sandbox.stub(Repo, 'findByUser').yields(null, 123)
    var req = {
      user: {
        _id: 'asd',
        token: 'asd'
      },
      query: {}
    }
    var res = {}
    res.render = sinon.spy()
    routes.account(req, res)
    var resArgs = res.render.args[0]
    assert.equal(resArgs[0], 'account.jade')
    assert.deepEqual(resArgs[1], {user: req.user, repos: 123, _: _, owner: req.user})
  })

  it('.getAccountRepo(req, res) calls Repo.findById and Doclet.find and res.render("repo.jade")', function () {
    sandbox.stub(Repo, 'findById').yields(null, 123)
    sandbox.stub(Doclet, 'find').yields(null, 333)
    var req = {
      user: {
        _id: 'asd',
        token: 'asd'
      },
      params: {
        repo: 'tt'
      },
      flash: sinon.spy(function (which) {
        return which === 'error' ? [1] : [2]
      })
    }
    var res = {}
    res.render = sinon.spy()
    routes.getAccountRepo(req, res)
    var resArgs = res.render.args[0]
    assert.equal(resArgs[0], 'repo.jade')
    var expectedParams = {
      user: req.user,
      repo: 123,
      _: _,
      doclets: 333,
      owner: req.user,
      error: 1,
      result: 2
    }
    assert.deepEqual(resArgs[1], expectedParams)
    assert(req.flash.calledWith('error'))
    assert(req.flash.calledWith('result'))
  })

  it('.setAccountRepo(req, res) calls Repo.findById and enables webhook and res.redirect("/account/<repo>")', function () {
    var repo = {}
    repo.enableWebHook = sinon.stub().yields(null)
    sandbox.stub(Repo, 'findById').yields(null, repo)
    var req = {
      user: {
        _id: 'asd',
        token: 'asd'
      },
      params: {
        repo: 'tt'
      },
      body: {
        enabled: 'on'
      },
      flash: sinon.spy()
    }
    var res = {}
    res.redirect = sinon.spy()
    routes.setAccountRepo(req, res)
    assert(res.redirect.calledWith('/account/tt'))
    assert(repo.enableWebHook.calledWith())
  })

  it('.serializeUser() creating a new User', function (done) {
    var ghUser = {
      profile: {
        id: 123
      }
    }
    sandbox.stub(User, 'findOne')
      .withArgs({passportId: ghUser.profile.id})
      .yields(null, null)

    sandbox.stub(User, 'createFromGitHubPassport')
      .withArgs(ghUser)
      .yields(null, ghUser.profile.id)

    routes.serializeUser(ghUser, function (err, id) {
      assert(!err)
      assert.equal(id, ghUser.profile.id)
      done()
    })
  })

  it('.serializeUser() retrieving an existing User', function (done) {
    var ghUser = {
      profile: {
        id: 123
      }
    }
    sandbox.stub(User, 'findOne')
      .withArgs({passportId: ghUser.profile.id})
      .yields(null, 444)

    routes.serializeUser(ghUser, function (err, id) {
      assert(!err)
      assert.equal(id, 123)
      done()
    })
  })

  it('.serializeUser() propagates error', function (done) {
    var ghUser = {
      profile: {
        id: 123
      }
    }
    sandbox.stub(User, 'findOne')
      .withArgs({passportId: ghUser.profile.id})
      .yields('some error')

    routes.serializeUser(ghUser, function (err, id) {
      assert.equal(err, 'some error')
      assert(!id)
      done()
    })
  })

  it('.deserializeUser() calls User.findOne', function (done) {
    sandbox.stub(User, 'findOne')
      .withArgs({passportId: 123})
      .yields(null, 'user')

    routes.deserializeUser(123, function (err, user) {
      assert(!err)
      assert.equal(user, 'user')
      done()
    })
  })
})