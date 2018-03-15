const app = require('./config.js');
const main = require('./controllers/main.js');
const calendar = require('./controllers/calendar.js');

app.get('/status', main.status);
app.get('/events', calendar.getEvents);
app.get('/url', calendar.getConcentPageUrl);

app.get('/oauth', function (req, res) {
    console.log(req);
    return res.json({params: req.params});
});

// Redirect all non api requests to the 404
app.get('/*', (req, res) => {
    res.status(404).send('Unknown endpoint');
});