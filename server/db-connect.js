const mongoose = require('mongoose');
const config = require('./config.js');
const mongoURI = config.mongoURI;
const options = config.mongoOptions;
require('./models/init.js').initialize();

mongoose.connection.once('open', function () {
    console.info('MongoDB connected [%s]', mongoURI);

    mongoose.connection.on('disconnected', function () {
        console.info('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', function () {
        console.info('MongoDB reconnection');
    });

    mongoose.connection.on('error', function (err) {
        console.error('MongoDB error: ' + err);
    });
});

module.exports = mongoose.connect(mongoURI, options, function (err) {
    if (err) {
        console.error('MongoDB connection error: ' + err);
        // return reject(err);
        process.exit(1);
    }
});