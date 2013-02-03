var join = require('path').join;
var utils = require('./utils');
var debug = require('debug')('load-engine');

function installAll(modules) {
  if (typeof modules === 'string') modules = [modules];
  return utils.install(modules, join(__dirname, '..', '..', '..'));
}

function requireAll(modules) {
  if (typeof modules === 'string') modules = [modules];
  var res = [];
  debug('requiring modules');
  for (var i = 0; i < modules.length; i++) {
    if (modules[i] === '.') res.push({});
    else res.push(utils.getModule(modules[i]));
  }
  debug('required modules');
  return res;
}


function load(modules, options, errored) {
  options = options || {};
  var repl = options.repl === false ? false : true;

  return utils.checkNPM()
    .then(function (npm) {
      for (var i = 0; i < modules.length; i++) {
        try {
          return requireAll(modules[i]);
        } catch (ex) {}
      }
      if (npm) {
        requireAll(modules[0]);
      } else {
        errored = true;
        requireAll(modules[0]);
      }
    })
    .then(null, function (err) {
      if (errored) throw err;
      if (repl) {
        if (modules.length === 1) {
          return utils.ask('Do you wish to install ' + JSON.stringify(modules[0]) + '? (yes) ')
            .then(function (answer) {
              if (answer === '' || answer === 'y' || answer === 'ye' || answer === 'yes')
                return installAll(modules[0]);
            })
            .then(function () {
              return load(modules, options, true);
            });
        } else {
          var question = '\nYou must install one of the following:\n' + 
            modules.map(function (module, i) {
              return '  ' + (i + 1) + ') ' + JSON.stringify(module);
            }).join('\n') + 
            '\nType the number of the module to install or press enter to cancel: ';
          return utils.ask(question)
            .then(function (answer) {
              if (modules[(+answer) - 1]) {
                return installAll(modules[(+answer) - 1]);
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