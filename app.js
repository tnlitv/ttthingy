
require('dotenv').config();
require('./db-connect.js').connect();

const API = require('./routes');
const server = require('./bot/bot');

server.use(bodyParser.json());
server.use(express.static(path.join(__dirname, 'public')));
server.use(session({
    secret: 'red',
    resave: true,
    saveUninitialized: true,
}));
server.use('/', API);