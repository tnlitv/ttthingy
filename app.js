// 'use strict';

// require('dotenv').config();

require('./lib/new_index.js')();

// const http = require('http');
// const express = require('express');
// const path = require('path');
// const app = require('./server/config.js');
// const session = require('express-session');
//
// app.use(express.static(path.join(__dirname, 'public')));
// app.use(session({
//     secret: 'red',
//     resave: true,
//     saveUninitialized: true,
// }));
// require('./server/db-connect.js').connect();
// require('./server/routes.js');
//
// // Starting express server
// module.exports = http.createServer(app).listen(app.get('port'), function () {
//     console.log(`Express server listening on port ${app.get('port')}`);
// });