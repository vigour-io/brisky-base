'use strict'
var parse = require('./parse')

/**
 * @function Properties.default
 * helper for normal sets (property is set immediately on key)
 * @memberOf Properties#
 * @return {Base|undefined} when undefined no change happened
 */
exports.default = function (val, stamp, resolve, nocontext, key) {
  if (this[key] !== val) {
    this[key] = val
    return this
  }
}

/**
 * @function Properties.createPrimitiveProperty
 * helper for sets, property is set on different key
 * @param {string} field set property on field
 * @memberOf Properties#
 */
exports.createPrimitiveProperty = function (field) {
  return function (val, stamp, resolve, nocontext, key) {
    return exports.default.call(this, val, stamp, nocontext, field)
  }
}

/**
 * @function Properties.createPropertyConstructor
 * helper for Constructors as properties
 * @memberOf Properties#
 * @param {function} Constructor the constructor to be wrapped
 * @param {string} key - key of the property
 * @param {string} [override] - override the normal key
 * @todo share the propertyConstructor function
 */
exports.createPropertyConstructor = function (Constructor, key, override) {
  var proto = Constructor.prototype
  proto._useVal = true
  if (!proto.key) {
    proto.key = key
  }

  function propertyConstructor (val, stamp, resolve, nocontext, type, escape) {
    // this, val, stamp, nocontext, type, escape
    if (override) {
      type = key
    }

    // or override
    var property = this[type]
    // way more efficient then set key internal apparantly?
    if (!property) {
      // is this the magic trick?
      let instance = new Constructor(void 0, stamp, this, type)
      this.addNewProperty(
        type,
        instance,
        void 0,
        stamp
      )
      this[type].set(val, stamp) // add resolve etc
      return this[type]
    }
    return this.setKeyInternal(type, val, stamp, nocontext, property)
  }
  // same as getPrototypeOf
  propertyConstructor.base = proto
  return propertyConstructor
}

exports.custom = function (properties, property, key, stamp) {
  if (property === null) {
    properties[key] = null
  } else if (property.val) {
    property.val = parse(property.val)
    var prototype = property.val.prototype
    if (prototype && typeof prototype === 'object' && prototype._base_version) {
      if (property.override) {
        properties._overrides = properties._overrides || {}
        properties._overrides[key] = property.override
        properties[key] = exports
          .createPropertyConstructor(property.val, property.override, true)
        properties[key].override = property.override
        properties[property.override] = properties[key]
      } else {
        this[key] = properties[key] = prototype
        prototype._parent = this
      }
    } else {
      if (property.override) {
        properties[key] = exports.createPrimitiveProperty(property.override)
      } else {
        properties[key] = exports.default
      }
      properties[key].call(this, property.val, void 0, void 0, key)
    }
  } else if (key !== '_overrides') {
    if (property.type) {
      let res = this.getType(property, stamp, key, void 0)
      if (typeof res === 'object' && res._base_version) {
        properties[key] = exports
        .createPropertyConstructor(new res.Constructor(property, false, this, key).Constructor, key)
        return
      }
    }
    properties[key] = exports
      .createPropertyConstructor(new this.Child(property, false, this, key).Constructor, key)
  }
}