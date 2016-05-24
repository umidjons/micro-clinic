var mongoose = require('mongoose');

var PermissionSchema = mongoose.Schema({
    _id: String,
    title: String
});

var Permission = mongoose.model('Permission', PermissionSchema);

module.exports.PermissionSchema = PermissionSchema;
module.exports.Permission = Permission;