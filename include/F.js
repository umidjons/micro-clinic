'use strict';

var util = require('util');
var sugar = require('sugar');

class F {

    /**
     * Outputs object into console with util.inspect applied.
     * @param {object} obj any primitive or complex type value
     * @param {string} prefix message before value, such as `Data:`
     */
    static inspect(obj, prefix, ret) {
        prefix = prefix || '';
        var result = util.inspect(obj, false, null, true);
        if (ret) {
            return prefix + ' ' + result;
        }
        console.log(prefix, result);
    }

    /**
     * Formats date object as full date and time string.
     * @param {Date} date Date object to format.
     * @returns {*|String} Formatted string in <strong>dd.MM.yyyy HH:mm:ss</strong> format.
     */
    static formatDateTime(date) {
        return Date.create(date).format('{dd}.{MM}.{yyyy} {HH}:{mm}:{ss}');
    }

    /**
     * Formats number object.
     * @param {Number} number Number to format.
     * @returns {*|String} Formatted string in <strong>NNN NNN.NN</strong> format.
     */
    static formatNumber(number) {
        return number.format(2, ' ');
    }
}

module.exports = F;