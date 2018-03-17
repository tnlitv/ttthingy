const mongoose = require('mongoose');
const config = require('./config.js');
const mongoURI = process.env.MONGODB_URI;
const options = config.mongoOptions;
const RECONNECT_INTERVAL = 15000;
mongoose.Promise = Promise;
require('./models/init.js').initialize();

mongoose.connection.once('open', function () {
    console.info('MongoDB connected [%s]', mongoURI.split('@')[1] || mongoURI);

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

async function connect() {
    try {
        await mongoose.connect(mongoURI, options);
    } catch (e) {
        console.error(e.stack.split('\n').splice(0, 3).join('\n'));
        setTimeout(connect, RECONNECT_INTERVAL);
    }
}

module.exports = {
    connect,
};