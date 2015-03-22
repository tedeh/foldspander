var _ = require('lodash');
var utils = require(__dirname + '/utils');

/**
 * @class Foldspander
 * @param {Object} [options]
 * @param {Boolean} [options.native=false] - Fold and expand native JavaScript objects
 * @param {String} [options.token='@'] - Token to identify Foldspander properties
 * @return {Foldspander} - When called without new
 */
var Foldspander = module.exports = function(options) {
  options = options || {};

  if(!(this instanceof Foldspander)) {
    return new Foldspander(options);
  }

  this.options = options;

  var defaultOptions = {
    token: '$',
    native: false,
    descend: _.negate(utils.isRepresentableAsJSON)
  };

  _.defaults(this.options, options, defaultOptions);

  _.bindAll(this, 'fold', 'expand', '_foldOne', 'add', 'has', 'remove', 'native', '_tokenize');

  // bind these functions to this instance
  this._matchers = {};

  if(this.options.native) {
    this.native(this.options.native);
  }

};

/**
 * @description Map of predefined matchers
 * @enum {String}
 * @static
 */
Foldspander.matchers = {

  /**
   * @description Returns closure that matches an object with instanceof
   * @param {Function} base - Matches if object is an instance of this
   * @return {Function}
   */
  instanceof: function(base) {
    return function(obj) {
      return obj instanceof base;
    };
  }

};

/**
 * @description Map of predefined folders
 * @enum {Function}
 * @static
 */
Foldspander.folders = {

  /**
   * @description Returns closure that picks properties from an object by a list
   * @param {...String} vars - Array of properties to pick
   * @return {Function}
   */
  pick: function() {
    var vars = _.flatten(arguments, true);
    return function(obj) {
      return _.pick(obj, vars);
    };
  }

};

/**
 * @description Map of predefined expanders
 * @enum {Function}
 * @static
 */
Foldspander.expanders = {

  /**
   * @description Returns closure that instantiates an class with arguments from a list
   * @param {Function} base - Class to instantiate
   * @param {Array} vars - Name of vars from object to pass in order to the constructor
   * @return {Function}
   */
  construct: function(base, names) {
    return function(obj) {

      var vars = _.chain(obj).pick(names).toArray().value();
      var instance = Object.create(base.prototype);

      base.apply(instance, vars);

      return instance;

    };
  }

};

/**
 * @description Determines if a matcher is active
 * @param {String} name - Matcher to check
 * @return {Boolean}
 */
Foldspander.prototype.has = function(name) {
  return name in this._matchers;
};

/**
 * @description Add a matcher to fold/expand a type
 * @param {String} name - Name for this type
 * @param {Function} match - Function that returns true for a matching type
 * @param {Function|Array} [fold] - Function that returns folded properties
 * @param {Function|Array} [expand] - Function that expands a folded object
 * @throws {TypeError} If a matcher of name already exists
 */
Foldspander.prototype.add = function(name, match, fold, expand) {

  if(this.has(name)) {
    throw new TypeError('Matcher with name "' + name + '" already exists');
  }

  // no extra properties stored when no fold function defined
  if(!fold) {
    fold = function() { return {}; };
  }

  // if fold is array, get predefined folder named "pick"
  if(_.isArray(fold)) {
    fold = Foldspander.folders.pick(fold);
  }

  this._matchers[name] = {
    match: match,
    fold: fold,
    expand: expand
  };

};

/**
 * @description Remove a matcher to fold/expand a type
 * @param {String} name - Name of matcher to remove
 */
Foldspander.prototype.remove = function(name) {

  if(!this.has(name)) {
    return;
  }

  delete this._matchers[name];

};

/**
 * @description Stringifies a object to JSON using JSON.stringify and folding first
 * @param {Object} obj
 * @return {String}
 */
Foldspander.prototype.stringify = function(obj) {
  var fold = this.fold(obj);
  return JSON.stringify(fold);
};

/**
 * @description Parses a JSON string using JSON.parse and expands it afterwards
 * @param {String} str
 * @return {Object}
 */
Foldspander.prototype.parse = function(str) {
  var obj = JSON.parse(str);
  return this.expand(obj);
};

/**
 * @description Get a function suitable for the JSON.stringify replacer argument
 * @return {Function}
 */
Foldspander.prototype.getReplacer = function() {
  var self = this;

  return function(key, value) {
    if(utils.isRepresentableAsJSON(value)) {
      return value;
    } else {
      return self.fold(value);
    }
  };

};

/**
 * @description Get a function suitable for the JSON.parse reviver argument
 * @return {Function}
 */
Foldspander.prototype.getReviver = function() {
  var self = this;

  return function(key, value) {
    //console.log('k', key, 'v', value)
    if(utils.isRepresentableAsJSON(value)) {
      return value;
    } else if(!key) {
      return value;
    } else {
      return self.expand(value);
    }
  };

};

/**
 * @description Instance folds/expands native JavaScript types
 * @param {Boolean} [to]
 * @return {Boolean}
 */
Foldspander.prototype.native = function(to) {

  if(arguments.length === 0) {
    return this.options.native;
  }

  this.options.native = to;

  if(to) {

    // Date
    this.add('native_date', _.isDate,
      function(obj) { return {timestamp: obj.valueOf()}; },
      function(obj) { return new Date(obj.timestamp); }
    );

    // RegExp
    this.add('native_regexp', _.isRegExp,
      ['source', 'global', 'multiline', 'ignoreCase'],
      function(obj) {
        var flags = [
          obj.multiline ? 'm' : '',
          obj.global ? 'g' : '',
          obj.ignoreCase ? 'i' : ''
        ].join('');
        return new RegExp(obj.source, flags);
      }
    );

    // NaN
    this.add('native_nan', _.isNaN, null, function(obj) {
      return NaN;
    });

    // Infinity
    this.add('native_infinity',
      function(obj) { return obj === Infinity || obj === -Infinity },
      function(obj) { return {negative: obj === -Infinity}; },
      function(obj) { return obj.negative ? -Infinity : Infinity; }
    );
  
  } else {

    this.remove('native_date');
    this.remove('native_regexp');
    this.remove('native_nan');
    this.remove('native_infinity');
  
  }

  return to;
};

/**
 * @description Folds a complex object into a simple one
 * @param {Object} obj - The object to fold
 * @return {Object}
 */
Foldspander.prototype.fold = function(obj) {

  for(var name in this._matchers) {
    var matcher = this._matchers[name];

    if(matcher.match(obj)) {
      return this._foldOne(obj, name, matcher.fold(obj));
    }
  }

  if(!utils.isIterableJSON(obj)) {
    return obj;
  }

  return walk(this.fold, obj, this.options);
};

/**
 * @description Expands a previously folded object into a native complex one
 * @param {Object} obj - The object to expand
 * @return {Object}
 */
Foldspander.prototype.expand = function(obj) {

  var tokenKey = this._tokenize('name');
  var name = obj[tokenKey];
  var hasMatch = tokenKey in obj
                 && name in this._matchers;

  // encountered a folded type
  if(hasMatch) {
    return this._matchers[name].expand(obj);
  }

  if(!utils.isIterableJSON(obj)) {
    return obj;
  }

  return walk(this.expand, obj, this.options);
};

/**
 * @description Make a folded version of a single complex object
 * @param {Object} obj - The object to fold
 * @param {String} name - Name of the object
 * @param {Object} [props] - Properties to include
 * @return {Object}
 * @api private
 */
Foldspander.prototype._foldOne = function(obj, name, props) {
  props = props || {};
  props[this._tokenize('name')] = name;
  return props;
};

/**
 * @description Tokenize a name
 * @param {String} name
 * @return {String}
 * @api private
 */
Foldspander.prototype._tokenize = function(name) {
  return this.options.token + name;
};

/**
 * @description Iterates over an object and creates a new one
 * @param {Function} recurse - Function to evaluate what to do with a complex object
 * @param {Object} obj - Object to look at
 * @param {Object} [options]
 * @param {Function} [options.descend] - Determines if we should recurse down into the current object
 * @return {Object}
 * @api private
 */
function walk(recurse, obj, options) {
  options = options || {};

  var key, value, out, outval;
  var isArray = _.isArray(obj);
  out = isArray ? [] : {};

  for(key in obj) {
    value = obj[key];

    if(options.descend(value)) {
      outval = recurse(value);
    } else {
      outval = value;
    }

    if(isArray) {
      out.push(outval);
    } else {
      out[key] = outval;
    }

  }

  return out;

}
