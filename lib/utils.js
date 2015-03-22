var _ = require('lodash');
var utils = module.exports = {};

/**
 * @description Determines if an object is representable as JSON
 * @param {Object} obj
 * @return {Boolean}
 */
utils.isRepresentableAsJSON = function(obj) {
  return _.isNull(obj)
      || _.isBoolean(obj)
      || _.isFinite(obj)
      || _.isString(obj);
};

/**
 * @description Determines if an object is iterable as JSON
 * @param {Object} obj
 * @return {Boolean}
 */
utils.isIterableJSON = function(obj) {
  return _.isPlainObject(obj)
      || _.isArray(obj);
};
