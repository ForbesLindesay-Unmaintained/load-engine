var cp = require('child_process');
var Promise = require('promise');
var debug = require('debug')('load-engine');

function exec(command, options) {
  return new Promise(function (resolver) {
    cp.exec(command, options, function (err, stdout, stderr) {
      if (err) resolver.reject(err);
      else resolver.fulfill({stdout: stdout, stderr: stderr});
    })
  });
}

var checkedNPM = null;
exports.checkNPM = checkNPM;
function checkNPM() {
  if (checkedNPM !== null) {
    return checkedNPM;
  }
  debug('checking npm');
  try {
    require('readline');
  } catch (ex) {
    return checkedNPM = new Promise(function (res) { res.fulfill(false); });
  }
  return checkedNPM = exec('npm --version')
    .then(function () {
      debug('has npm');
      return true;
    }, function () {
      debug('does not have npm');
      return false;
    });
}

exports.install = install;
function install(modules, directory) {
  return exec('npm install ' + modules.join(' ') + ' --save', {cwd: directory});
}

exports.getModule = getModule;
function getModule(module) {
  return require(module);
}

exports.ask = ask;
function ask(question) {
  var readline = require('readline');
  return new Promise(function (resolver) {
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(question, function (answer) {
      rl.close();
      answer = answer.toLowerCase();
      resolver.fulfill(answer);
    });
  });
}

