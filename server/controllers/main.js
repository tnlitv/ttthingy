const mongoose = require('mongoose');

const status = function (req, res) {
    return res.json({
        server: 'ok',
        db: mongoose.connection.readyState,
    });
};

module.exports = {
    status,
};