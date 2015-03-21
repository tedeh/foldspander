var utils = module.exports = {};

/**
 * @description Determines if an object is an Array
 * @param {Object} obj
 * @return {Boolean}
 */
utils.isArray = function(obj) {
  if(!obj) return false;
  return Object.prototype.toString.call(obj) === '[object Array]';
};

/**
 * @description Determines if an object is a Date
 * @param {Object} obj
 * @return {Boolean}
 */
utils.isDate = function(obj) {
  return obj instanceof Date;
};

/**
 * @description Determines if an object is a RegExp
 * @param {Object} obj
 * @return {Boolean}
 */
utils.isRegExp = function(obj) {
  return obj instanceof RegExp;
};

/**
 * @description Determines if an object is NaN
 * @param {Object} obj
 * @return {Boolean}
 */
utils.isNaN = function(obj) {
  return isNaN(obj)
      && typeof(obj) === 'number';
};

/**
 * @description Determines if an object is Infinity or -Infinity
 * @param {Object} obj
 * @return {Boolean}
 */
utils.isInfinity = function(obj) {
  return obj === Infinity
      || obj === -Infinity;
};

/**
 * @description Determines if an object is simple (not worth iterating over)
 * @param {Object} obj
 * @return {Boolean}
 */
utils.isSimple = function(obj) {
  return typeof(obj) === 'boolean'
      || typeof(obj) === 'number'
      || typeof(obj) === 'string'
      || typeof(obj) === 'undefined'
      || obj === null;
};
