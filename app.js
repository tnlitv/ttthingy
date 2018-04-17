
require('dotenv').config();

const app = require('./server/config');
require('./bot/bot')(app);
