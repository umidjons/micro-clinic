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
     * Formats date object as a full date and time string.
     * @param {Date} date Date object to format.
     * @returns {*|String} Formatted string in <strong>dd.MM.yyyy HH:mm:ss</strong> format.
     */
    static formatDateTime(date) {
        return Date.create(date).format('{dd}.{MM}.{yyyy} {HH}:{mm}:{ss}');
    }

    /**
     * Formats date object as a full date string without time part.
     * @param {Date} date Date object to format.
     * @returns {*|String} Formatted string in <strong>dd.MM.yyyy</strong> format.
     */
    static formatDate(date) {
        return Date.create(date).format('{dd}.{MM}.{yyyy}');
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

    /**
     * Normalizes start date to the start of the day, end date to the end of the day
     * and returns period object with start and end properties.
     * @param {date} startDate start date
     * @param {date} endDate end date
     * @returns {object} {start: "normalized start date", end: "normalized end date"}
     */
    static normalizePeriod(startDate, endDate) {
        startDate = startDate || 'today';
        endDate = endDate || 'today';

        startDate = Date.create(startDate);
        endDate = Date.create(endDate);

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        return {
            start: startDate,
            end: endDate
        };
    }

    /**
     * Escapes specified string for use in regular expression.
     * @param {string} str string to escape
     * @returns {string | undefined} escaped string or undefined if str is not string
     */
    static escapeForRegExp(str) {
        if (typeof str !== 'string') {
            return undefined; //throw new TypeError('Expected a string');
        }
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    /**
     * Returns from array of objects array of object[property] values.
     * @param {array} arr array of objects
     * @param {string} prop property name
     * @returns {*} {array | undefined} array of object property values or undefined if arr is not array
     */
    static arrayOfProps(arr, prop) {
        if (Array.isArray(arr)) {
            return arr.map(function (item) {
                return item[prop];
            });
        } else {
            return undefined;
        }
    }
}

module.exports = F;