const app = require('./config.js');
const main = require('./controllers/main.js');

app.get('/status', main.status);

// Redirect all non api requests to the 404
app.get('/*', (req, res) => {
    res.status(404).send('Unknown endpoint');
});