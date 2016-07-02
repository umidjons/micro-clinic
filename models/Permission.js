var mongoose = require('mongoose');

var PermissionSchema = mongoose.Schema({
    _id: String,
    title: String
});

PermissionSchema.index({_id: 1}, {unique: true});

var Permission = mongoose.model('Permission', PermissionSchema);

module.exports.PermissionSchema = PermissionSchema;
module.exports.Permission = Permission;