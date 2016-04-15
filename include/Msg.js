'use strict';

const STATUS_INFO = 'info';
const STATUS_SUCCESS = 'success';
const STATUS_WARNING = 'warning';
const STATUS_ERROR = 'error';

class Msg {
    /**
     * Adds message to the X-MSG header as JSON string.
     * @param res HTTP Response object instance
     * @param {string} message message text
     * @param {string} status status code (200-success, 455-warning,400-error)
     */
    static add(res, message, status) {
        let msg = {
            message,
            code: status
        };

        let hdr = res.get('X-MSG');
        hdr = hdr ? JSON.parse(decodeURI(hdr)) : [];

        hdr.push(msg);
        hdr = encodeURI(JSON.stringify(hdr));

        res.set('X-MSG', hdr);
    }

    /**
     * Appends error to the X-MSG header as JSON string.
     * @param res HTTP Response object instance
     * @param {string} message error text
     */
    static error(res, message) {
        this.add(res, message, STATUS_ERROR);
    }

    /**
     * Appends warning to the X-MSG header as JSON string.
     * @param res HTTP Response object instance
     * @param {string} message warning text
     */
    static warning(res, message) {
        this.add(res, message, STATUS_WARNING);
    }

    /**
     * Appends success type message to the X-MSG header as JSON string.
     * @param res HTTP Response object instance
     * @param {string} message success type message text
     */
    static success(res, message) {
        this.add(res, message, STATUS_SUCCESS);
    }

    /**
     * Appends information message to the X-MSG header as JSON string.
     * @param res HTTP Response object instance
     * @param {string} message info type message text
     */
    static info(res, message) {
        this.add(res, message, STATUS_INFO);
    }

    /**
     * Sends error message in the X-MSG header and error object in the response body.
     * Also outputs error message into console.
     * @param res HTTP Response object instance
     * @param {object} err error message text
     */
    static sendError(res, err) {
        // set content-type to application/json
        res.type('json');

        let msg = 'Ошибка: ' + err.message;
        console.error(err);
        this.error(res, msg);
        res.json({code: STATUS_ERROR, message: msg, err: err});
    }

    /**
     * Sends success message in the X-MSG header and in the response body.
     * Also outputs info into console.
     * If additional data provided, then only it will be send in the response body.
     * @param res HTTP Response object instance
     * @param {string} message success message text
     * @param data additional data to send
     * @param {string} dataPrefix prefix in the console output for the additional data
     */
    static sendSuccess(res, message, data, dataPrefix) {
        // set content-type to application/json
        res.type('json');

        if (message) {
            // set message if exists
            let msg = 'Ура! ' + message;
            //console.info(msg);
            this.success(res, msg);

            // if no data provided, then send message as response body too
            if (!data) {
                return res.json({code: STATUS_SUCCESS, message: msg});
            }
        }

        // if data provided, send only it in the response body
        if (data) {
            let pfx = dataPrefix ? dataPrefix : 'Data:';
            //console.log(pfx, data);
            return res.json(data);
        }

    }
}

module.exports = Msg;