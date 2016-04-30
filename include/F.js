'use strict';

var util = require('util');

class F {

    /**
     * Outputs object into console with util.inspect applied.
     * @param {object} obj any primitive or complex type value
     * @param {string} prefix message before value, such as `Data:`
     */
    static inspect(obj, prefix) {
        prefix = prefix || '';
        console.log(prefix, util.inspect(obj, false, null, true));
    }
}

module.exports = F;