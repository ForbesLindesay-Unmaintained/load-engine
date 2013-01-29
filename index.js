var readline = require('readline');
var Promise = require('promise');

var cp = require('child_process');
var join = require('path').join;

function checkNPM() {
  return new Promise(function (resolver) {
    cp.exec('npm --version', function (err) {
      if (err) resolver.fulfill(false);
      else resolver.fulfill(true);
    })
  });
}
function installAll(modules) {
  if (typeof modules === 'string') modules = [modules];
  return new Promise(function (resolver) {
    cp.exec('npm install ' + modules.join(' ') + ' --save', {cwd: join(__dirname, '..', '..')}, function (err) {
      if (err) return resolver.reject(err);
      else return resolver.fulfill(null);
    })
  });
}

function requireAll(modules) {
  if (typeof modules === 'string') {
    if (modules === '.') return {};
    return require(modules);
  }
  var res = [];
  for (var i = 0; i < modules.length; i++) {
    res.push(require(modules[i]));
  }
  return res;
}



function load(modules, options, errored) {
  options = options || {};
  var repl = options.repl === false ? false : true;

  return new checkNPM()
    .then(function (npm) {
      for (var i = 0; i < modules.length; i++) {
        if (requireAll(modules[i])) {
          try {
            return requireAll(modules[i]);
          } catch (ex) {}
        }
      }
      if (npm) {
        throw new Error('Couldn\'t require modules');
      } else {
        errored = true;
        requireAll(modules[i]);
      }
    })
    .then(null, function (err) {
      if (errored) throw err;
      if (repl) {
        if (modules.length === 1) {
          return ask('Do you wish to install ' + JSON.stringify(modules[0]) + '? (yes) ')
            .then(function (answer) {
              if (answer === '' || answer === 'y' || answer === 'ye' || answer === 'yes')
                return installAll(modules[0]);
            })
            .then(function () {
              return load(modules, options, true);
            });
        } else {
          console.log('\nYou must install one of the following:');
          modules.forEach(function (module, i) {
            console.log('  ' + i + ') ' + JSON.stringify(module));
          });
          return ask('Type the number of the module to install or press enter to cancel: ')
            .then(function (answer) {
              if (modules[answer]) {
                return installAll(modules[answer]);
              }
            })
            .then(function () {
              return load(modules, options, true);
            })
        }

      } else {
        return installAll(modules[0])
          .then(function () {
            return load(modules, options, true);
          });
      }
    });
}

function ask(question) {
  return new Promise(function (resolver) {
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(question, function (answer) {
      answer = answer.toLowerCase();
      resolver.fulfill(answer);
      rl.close();
    });
  });
}

module.exports = function (modules, options, cb) {
  if (arguments.length === 2 && typeof options === 'function') {
    cb = options;
    options = null;
  }
  if (typeof cb === 'function') {
    load(modules, options, false)
      .then(function (res) { process.nextTick(function () { cb(null, res); }); },
            function (err) { process.nextTick(function () { cb(err); });       });
  } else {
    return load(modules, options, false);
  }
}