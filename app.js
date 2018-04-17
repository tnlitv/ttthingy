require('dotenv').config();
const path = require('path');
const bodyParser = require('body-parser');
const express = require('express');
const session = require('express-session');
require('./server/db-connect.js').connect();
const API = require('./server/routes');
const server = require('./bot/bot');

server.use(bodyParser.json());
server.use(express.static(path.join(__dirname, 'public')));
server.use(session({
    secret: 'red',
    resave: true,
    saveUninitialized: true,
}));
server.use('/', API);