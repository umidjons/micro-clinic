'use strict';

class L {

    set logger(logger) {
        this._logger = logger;
    }

    get logger() {
        return this._logger;
    }

    set context(ctx) {
        this._context = ctx;
    }

    get context() {
        return this._context;
    }

    static meta(context, data) {
        if (context) {
            L.context = context;
        }

        data = data || {};
        data.zContext = context ? context : L.context;
        data.zUserId = L.req && L.req.user ? L.req.user._id : null;
        data.zUsername = L.req && L.req.user ? L.req.user.username : null;
        data.zReqBody = L.req && L.req.body ? L.req.body : null;
        data.zReqParams = L.req && L.req.params ? L.req.params : null;
        data.zReqQuery = L.req && L.req.query ? L.req.query : null;
        data.zHostname = L.req && L.req.hostname ? L.req.hostname : null;
        data.zIP = L.req && L.req.ip ? L.req.ip : null;
        data.zHeaders = L.req && L.req.headers ? L.req.headers : null;
        data.zMethod = L.req && L.req.method ? L.req.method : null;
        data.zOriginalUrl = L.req && L.req.originalUrl ? L.req.originalUrl : null;
        return data;
    }
}

module.exports = L;