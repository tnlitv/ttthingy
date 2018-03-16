'use strict';

require('dotenv').config();

// require('./lib/index.js')();

const http = require('http');
const express = require('express');
const path = require('path');
const app = require('./server/config.js');
const session = require('express-session');

app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'red',
    resave: true,
    saveUninitialized: true,
}));
require('./server/db-connect.js');
require('./server/routes.js');

// Starting express server
module.exports = http.createServer(app).listen(8000, function () {
    console.log('Express server listening on port 8000');
});