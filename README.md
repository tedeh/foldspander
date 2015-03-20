# foldspander

Foldspander is a dependency-less JavaScript utility to fold and expand complex objects into simpler ones fit for serialization.

Perfect for seamless object sharing between the client-side and the server-side!

[travis]: https://travis-ci.org/tedeh/foldspander
[travis-img]: https://travis-ci.org/tedeh/foldspander.png?branch=master

**Build status:** [![Build Status][travis-img]][travis] 

## Table of contents

- [Installation](#installation)
- [Usage](#usage)
  - [I just want to fold native objects](#i-just-want-to-fold-native-objects)
- [Tests](#tests)
- [Contributing](#contributing)

## Installation

Install the lastest version of `foldspander` from [npm](https://www.npmjs.com/) by executing `npm install foldspander` in your shell. 

## Usage

Usage is simple and consists of creating an instance of foldspander and assigning different types and behaviors too it.

Basic example in `examples/basic.js`:

```javascript
var Foldspander = require('foldspander');
var should = require('should');

var foldspand = new Foldspander({
  natives: true
});

var object = {
  id: 'id124',
  created_at: new Date()
};

var foldedObject = foldspand.fold(object);
var expandedObject = foldspand.expand(foldedObject);

expandedObject.should.eql(object);

```

### I just want to deal with native objects

If you don't need the extra functionality to serialize and expand classes and just want to fold the native objects that JSON lack support for, foldspander provides a simple convenience method that does not require instantiation.

### Why not use replacer and revivers

## Tests 

To run the [mocha.js](http://mochajs.org/) tests, go the the project folder and run:

```shell
npm install --dev
node_modules/.bin/mocha
```

## Performance

## Contributing

Highlighting [issues](https://github.com/tedeh/foldspander/issues) or submitting pull
requests on [Github](https://github.com/tedeh/foldspander) is most welcome.
