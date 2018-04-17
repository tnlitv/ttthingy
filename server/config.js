const path = require('path');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
require('./db-connect.js').connect();
const API = require('./routes');
const app = express();

app.set('port', process.env.PORT || process.env.SERVER_PORT || 8000);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'red',
    resave: true,
    saveUninitialized: true,
}));

app.use('/', API);

module.exports = app;
module.exports.mongoOptions = {
    useMongoClient: true
};