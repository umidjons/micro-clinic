var mongoose = require('mongoose');

var Mixed = mongoose.Schema.Types.Mixed;
var ObjectId = mongoose.Schema.Types.ObjectId;

var LogSchema = mongoose.Schema({
    message: String,
    timestamp: Date,
    level: String,
    meta: {
        message: String,
        data: Mixed,
        zContext: String,
        zUserId: ObjectId,
        zUsername: String,
        zReqBody: Mixed,
        zReqParams: Mixed,
        zReqQuery: Mixed,
        zHostname: String,
        zIP: String,
        zHeaders: Mixed,
        zMethod: String,
        zOriginalUrl: String
    }
}, {collection: 'log'});

LogSchema.index({level: 1});
LogSchema.index({'meta.zContext': 1});
LogSchema.index({'meta.zUserId': 1});
LogSchema.index({'meta.zUsername': 1});

var Log = mongoose.model('Log', LogSchema);

module.exports.Log = Log;
module.exports.LogSchema = LogSchema;