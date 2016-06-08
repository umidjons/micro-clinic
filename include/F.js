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

    /**
     * Converts array of objects to object.
     *
     * @example
     * Following array of objects
     * <pre>
     * [ 
     *     { id: 'item1', title: 'Item 1' },
     *     { id: 'item2', title: 'Item 2' } 
     * ]
     * </pre>
     * becomes <pre>{ item1: 'Item 1', item2: 'Item 2' }</pre> object.
     *
     * @param {array} arr array of objects.
     * @param {string} keyProp property of an object, which becomes keys of the resulting object.
     * @param {string} valProp property of an object, which becomes value of the key property.
     * @returns {{}} resulting object.
     *
     */
    static array2object(arr, keyProp, valProp) {
        let obj = {};
        for (let item of arr) {
            obj[item[keyProp]] = item[valProp];
        }
        return obj;
    }
}

module.exports = F;