'use strict';

/**
 * @module util
 */

const { format } = require('util');
const _RAW_TYPE_ARRAY_ = '[object Array]';
const _RAW_TYPE_NUMBER_ = '[object Number]';
const _RAW_TYPE_OBJECT_ = '[object Object]';
const _RAW_TYPE_REG_EXP_ = '[object RegExp]';
const _RAW_TYPE_STRING_ = '[object String]';

const getRawType = exports.getRawType = val => Object.prototype.toString.call(val)
exports.isArray = val => _RAW_TYPE_ARRAY_ === getRawType(val)
exports.isNumber = val => _RAW_TYPE_NUMBER_ === getRawType(val)
exports.isObject = val => _RAW_TYPE_OBJECT_ === getRawType(val)
exports.isRegExp = val => _RAW_TYPE_REG_EXP_ === getRawType(val)
exports.isString = val => _RAW_TYPE_STRING_ === getRawType(val)

exports.throwError = prefix => (message, ...otherArgs) => {
    message = `${prefix} ${message}`;
    throw new Error(format(message, ...otherArgs));
}
