'use strict'
/**
 * @function defaultProperty
 * helper for normal sets (property is set immediately on key)
 * @memberOf Properties#
 */
exports.property = function (val, stamp, resolve, nocontext, key) {
  if (this[key] !== val) {
    this[key] = val
    return this
  }
}

exports.map = function mapDefaultProperty (key, realKey) {
  return !realKey && realKey !== 0
    ? exports.property
    : function mapProperty (val, stamp, resolve, nocontext) {
      if (this[key] !== val) {
        this[key] = val
        return this
      }
    }
}
