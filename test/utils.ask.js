var utils = require('../lib/utils');
var assert = require('better-assert');

require('./unit-tests');

describe('utils.ask', function () {
  it('asks a question', function (done) {
    this.slow(20000);
    this.timeout(20000);
    utils.ask('\ntype yes: ')
      .then(function (res) {
        assert(res === 'yes');
        console.log();
        process.nextTick(function () { done(); });
      }, done);
  });
});