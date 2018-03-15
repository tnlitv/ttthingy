require('./lib/index.js')();

const http = require('http');
const express = require('express');
const path = require('path');
const app = require('./server/config.js');
require('./server/db-connect.js');
require('./server/routes.js');

app.use(express.static(path.join(__dirname, 'public')));

// Starting express server
module.exports = http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});