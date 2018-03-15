const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let counterSchema = Schema({
    _id: {
        type: String,
        required: true
    },
    seq: {
        type: Number,
        default: 0
    }
});

mongoose.model('counter', counterSchema);