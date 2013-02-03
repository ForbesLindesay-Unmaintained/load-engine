var load = require('../');
var utils = require('../lib/utils');
var assert = require('better-assert');
var sinon = require('sinon');
var Promise = require('promise');
var wrench = require('wrench');
var join = require('path').join;
var fs = require('fs');

function promise(val) {
  return new Promise(function (res) { res.fulfill(val); });
}

var parentPath = require('path').join(__dirname, '..', '..', '..');

it('checks for npm', function (done) {
  //the first time the check is run it's slow
  //after that the result is memoized
  this.slow(1000);
  utils.checkNPM()
    .then(function (res) {
      assert(res === true);
      done();
    })
})

describe('requiring a module that exists', function () {
  it('returns that module', function (done) {
    load(['better-assert'], function (err, res) {
      if (err) return done(err);
      assert(Array.isArray(res));
      assert(res.length === 1);
      assert(res[0] === assert);
      done();
    });
  })
});

describe('requiring several module that exists', function () {
  it('returns those modules as an array', function (done) {
    load([['better-assert', 'sinon']], function (err, res) {
      if (err) return done(err);
      assert(Array.isArray(res));
      assert(res.length === 2);
      assert(res[0] === assert);
      assert(res[1] === sinon);
      done();
    });
  })
});

describe('Giving 2 options where one exists', function () {
  describe('when the first one exsits', function () {
    it('returns the first one', function (done) {
      load(['better-assert', 'non-existant-module'], function (err, res) {
        if (err) return done(err);
        assert(Array.isArray(res));
        assert(res.length === 1);
        assert(res[0] === assert);
        done();
      });
    });
  });
  describe('when the second one exsits', function () {
    it('returns the second one', function (done) {
      load(['non-existant-module', 'better-assert'], function (err, res) {
        if (err) return done(err);
        assert(Array.isArray(res));
        assert(res.length === 1);
        assert(res[0] === assert);
        done();
      });
    });
  });
});

describe('with `npm` not installed', function () {
  var stub;
  before(function () {
    stub = sinon.stub(utils, 'checkNPM', function () {
      return promise(false);
    });
  });
  describe('when the module exists', function () {
    it('works as normal', function (done) {
      load(['better-assert'], function (err, res) {
        if (err) return done(err);
        assert(Array.isArray(res));
        assert(res.length === 1);
        assert(res[0] === assert);
        done();
      });
    });
  });
  describe('when the module does not exist', function () {
    it('rejects with the apropriate error', function (done) {
      load(['non-existant-module'], function (err, res) {
        assert(err);
        assert(err instanceof Error);
        assert(err.code === 'MODULE_NOT_FOUND');
        assert(err.message === "Cannot find module 'non-existant-module'");
        done();
      });
    });
  });
  after(function () {
    stub.restore();
  });
});
describe('with `{repl: false}`', function () {
  var stubGetModule, stubInstall, stubAsk;
  beforeEach(function () {
    stubGetModule = sinon.stub(utils, 'getModule');
    stubGetModule.throws();

    stubInstall = sinon.stub(utils, 'install', function () {
      stubGetModule.restore();
      return promise(null);
    });

    stubAsk = sinon.spy(utils, 'ask');
  });
  afterEach(function () {
    stubGetModule.restore();
    stubInstall.restore();
    stubAsk.restore();
  });
  it('automatically installs the first module in the array', function (done) {
    load(['sinon', 'non-existant-module'], {repl: false}, function (err, res) {
      if (err) return done(err);
      assert(!stubAsk.called);
      assert(stubInstall.calledOnce);
      assert(stubInstall.calledWith(['sinon'], parentPath));
      assert(Array.isArray(res));
      assert(res.length === 1);
      assert(res[0] === sinon);
      done();
    })
  });
  it('automatically installs the first modules in the array', function (done) {
    load([['sinon', 'better-assert'], 'non-existant-module'], {repl: false}, function (err, res) {
      if (err) return done(err);
      assert(!stubAsk.called);
      assert(stubInstall.calledOnce);
      assert(stubInstall.calledWith(['sinon', 'better-assert'], parentPath));
      assert(Array.isArray(res));
      assert(res.length === 2);
      assert(res[0] === sinon);
      assert(res[1] === assert);
      done();
    })
  });
});

describe('with `{repl: true}`', function () {
  var moduleNotFound = {};
  var stubGetModule, stubInstall, stubAsk;
  beforeEach(function () {
    stubGetModule = sinon.stub(utils, 'getModule');
    stubGetModule.throws(moduleNotFound);

    stubInstall = sinon.stub(utils, 'install', function () {
      stubGetModule.restore();
      return promise(null);
    });

    stubAsk = sinon.stub(utils, 'ask');
  });
  afterEach(function () {
    stubGetModule.restore();
    stubInstall.restore();
    stubAsk.restore();
  });
  it('installs the first module in the array if user types 1', function (done) {
    stubAsk.returns(promise('1'));
    load(['sinon', 'non-existant-module'], function (err, res) {
      if (err) return done(err);
      assert(stubAsk.calledOnce);
      assert(stubInstall.calledOnce);
      assert(stubInstall.calledWith(['sinon'], parentPath));
      assert(Array.isArray(res));
      assert(res.length === 1);
      assert(res[0] === sinon);
      done();
    })
  });
  it('installs the second module in the array if user types 2', function (done) {
    stubAsk.returns(promise('2'));
    load(['non-existant-module', 'better-assert'], function (err, res) {
      if (err) return done(err);
      assert(stubAsk.calledOnce);
      assert(stubInstall.calledOnce);
      assert(stubInstall.calledWith(['better-assert'], parentPath));
      assert(Array.isArray(res));
      assert(res.length === 1);
      assert(res[0] === assert);
      done();
    })
  });
  it('installs the only module if the user types `yes`', function (done) {
    stubAsk.returns(promise('yes'));
    load(['sinon'], function (err, res) {
      if (err) return done(err);
      assert(stubAsk.calledOnce);
      assert(stubInstall.calledOnce);
      assert(stubInstall.calledWith(['sinon'], parentPath));
      assert(Array.isArray(res));
      assert(res.length === 1);
      assert(res[0] === sinon);
      done();
    })
  });
  it('rejects with the apropriate error if the user types `no`', function (done) {
    stubAsk.returns(promise('no'));
    load(['sinon'], function (err, res) {
      assert(stubAsk.calledOnce);
      assert(!stubInstall.called);

      assert(err === moduleNotFound);
      done();
    })
  });
});

describe('utils.getModule', function () {
  it('returns module if exists', function () {
    assert(utils.getModule('better-assert') === assert);
  });
  it('throws otherwise', function () {
    try {
      utils.getModule('non-existant-module');
    } catch (ex) {
      return;
    }
    var ShouldNotGetHere = false;
    assert(ShouldNotGetHere);
  });
});

describe('utils.install', function () {
  before(function () {
    wrench.mkdirSyncRecursive(join(__dirname, 'fixture'));
    fs.writeFileSync(join(__dirname, 'fixture', 'package.json'), JSON.stringify({name: 'bar', version: '0.0.0'}));
  });

  it('installs the module', function (done) {
    this.slow(5000);
    this.timeout(10000);
    utils.install(['foo'], join(__dirname, 'fixture'))
      .then(function () {
        var packA = require('./fixture/package.json');
        assert(typeof packA.dependencies === 'object');
        assert(typeof packA.dependencies.foo === 'string');
        assert(packA.dependencies.foo);
        var packB = require('./fixture/node_modules/foo/package.json');
        assert(typeof packB === 'object');
        done();
      }, done);
  });

  after(function () {
    wrench.rmdirSyncRecursive(join(__dirname, 'fixture'));
  });
})