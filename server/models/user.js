const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let userSchema = Schema({
    id: {
        type: Number
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    slackId: {
        type: String,
    },
    jiraTokens: Object,
    googleTokens: Object,
});

userSchema.statics.set = async function save (user) {
    return this.findOneAndUpdate({
        email: user.email,
    }, user, {
        upsert: true,
        new: true,
    });
};

mongoose.model('User', userSchema);