const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let tokenSchema = Schema({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    jiraTokens: Object,
    googleTokens: Object,
});

tokenSchema.statics.set = function (token, data) {
    return this.findOneAndUpdate({
        id: token,
    }, data, {
        upsert: true,
        new: true,
    });
};

mongoose.model('Token', tokenSchema);