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
    native: false
  };

  // fill in missing options with default values
  for(var defaultKey in defaultOptions) {
    if(!(defaultKey in this.options)) {
      this.options[defaultKey] = defaultOptions[defaultKey];
    }
  }

  // bind these functions to this instance
  var bindFns = ['fold', 'expand', '_foldOne'];
  for(var bindKeyIndex in bindFns) {
    this[bindFns[bindKeyIndex]] = this[bindFns[bindKeyIndex]].bind(this);
  }

  this._matchers = {};

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
 * @param {Function} [fold] - Function that returns folded properties
 * @param {Function} [expand] - Function that expands a folded object
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

  if(this.has(name)) {
    return;
  }

  delete this._matchers[name];

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
    this.add('native_date', utils.isDate,
      function(obj) { return {timestamp: obj.valueOf()}; },
      function(obj) { return new Date(obj.timestamp); }
    );

    // RegExp
    this.add('native_regexp', utils.isRegExp,
      function(obj) { return {
        source: obj.source,
        global: obj.global,
        multiline: obj.multiline,
        ignoreCase: obj.ignoreCase
      }; },
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
    this.add('native_nan', utils.isNaN, null, function(obj) {
      return NaN;
    });

    // Infinity
    this.add('native_infinity', utils.isInfinity,
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

  return walk(this.fold, obj);
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

  return walk(this.expand, obj);
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
  var token = this.options.token;
  return token + name;
};

/**
 * @description Iterates over an object and creates a new one
 * @param {Function} recurse - Function to evaluate what to do with a complex object
 * @param {Object} obj - Object to look at
 * @return {Object}
 * @api private
 */
function walk(recurse, obj) {

  var key, value, out, outval;
  var isArray = utils.isArray(obj);
  out = isArray ? [] : {};

  for(key in obj) {
    value = obj[key];

    if(utils.isSimple(value)) {
      outval = value;
    } else {
      outval = recurse(value);
    }

    if(isArray) {
      out.push(outval);
    } else {
      out[key] = outval;
    }

  }

  return out;

}
