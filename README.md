[![Build Status](https://img.shields.io/travis/ForbesLindesay/load-engine/master.svg)](https://travis-ci.org/ForbesLindesay/load-engine)

# load-engine

  Load in engines for `transformers` asyncronously.  This can also be used to load other npm modules.

## Usage

  
```javascript
var load = require('load-engine');

load(['marked', 'supermarked', 'markdown-js', 'markdown'], function (err, res) {
  if (err) throw err;
  assert(Array.isArray(res));
  assert(res.length === 1);
  assert(res[0] === require('marked'));
});
```

Results in

```
You must install one of the following:
  1) "marked"
  2) "supermarked"
  3) "markdown-js"
  4) "markdown"
type the number of the module to install or press enter to cancel: 
```

And the assertion passes if the user types 1.

```javascript
load([['foo', 'bar']], function (err, res) {
  if (err) throw err;
  assert(Array.isArray(res));
  assert(res.length === 2);
  assert(res[0] === require('foo'));
  assert(res[1] === require('bar'));
});
```

Results in

```
Do you wish to install ["foo","bar"]? (yes)
```

And the assertions pass if the user presses enter, types `y`, types `ye` or types `yes`.