var mongoose = require('mongoose');

var TemplateSchema = mongoose.Schema({
    title: {type: String, required: true},
    content: {type: String, required: true},
    isDefault: {type: Number, min: 0, max: 1}
});

var Template = mongoose.model('Template', TemplateSchema);

module.exports.TemplateSchema = TemplateSchema;
module.exports.Template = Template;