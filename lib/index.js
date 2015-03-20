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

  this._updateMatchlist();

};

/**
 * @description Instance folds/expands native JavaScript types
 * @param {Boolean} [to]
 * @return {Boolean}
 */
Foldspander.prototype.native = function(to) {
  if(typeof(to) === 'undefined') return this.options.native;
  this.options.native = to;
  this._updateMatchlist();
  return to;
};

/**
 * @description Folds a complex object into a simple one
 * @param {Object} obj - The object to fold
 * @return {Object}
 */
Foldspander.prototype.fold = function(obj) {

  // check natives
  if(this.native()) {

    // encountered Date
    if(utils.isDate(obj)) {
      return this._foldOne(obj, 'native_date', {
        timestamp: obj.valueOf()
      });
    }

    // encountered RegExp
    if(utils.isRegExp(obj)) {
      return this._foldOne(obj, 'native_regexp', {
        source: obj.source,
        global: obj.global,
        multiline: obj.multiline,
        ignoreCase: obj.ignoreCase
      });
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
  var hasMatch = tokenKey in obj
                 && this._matchlist.indexOf(obj[tokenKey]) !== -1;

  // encountered a folded type
  if(hasMatch) {

    // expand native types
    if(this.native()) {

      var name = obj[this._tokenize('name')];

      // encountered folded Date
      if(name === 'native_date') {
        return new Date(obj.timestamp);
      }

      // encountered folded RegExp
      if(name === 'native_regexp') {
        var flags = [
          obj.multiline ? 'm' : '',
          obj.global ? 'g' : '',
          obj.ignoreCase ? 'i' : ''
        ].join('');
        return new RegExp(obj.source, flags);
      }

    }

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
 * @description Updates the internal expander matchlist of this instance
 * @api private
 */
Foldspander.prototype._updateMatchlist = function() {

  var matches = [];
  var natives = ['native_date', 'native_regexp'];

  if(this.options.native) {
    matches = matches.concat(natives);
  }

  this._matchlist = matches;

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
