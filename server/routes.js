const app = require('./config.js');
const main = require('./controllers/main.js');
const calendar = require('./controllers/calendar.js');
const Jira = new require('./controllers/jira');
const JiraService = new require('./services/jira/authentification');

app.get('/status', main.status);
app.get('/events', calendar.getEvents);
app.get('/url', calendar.getConcentPageUrl);

app.get('/oauth', function (req, res) {
    console.log(req);
    return res.json({params: req.params});
});

app.get('/status', main.status);
app.get('/jira/data', Jira.getData);
app.get('/jira/auth', JiraService.authenticate);
app.get('/jira/callback/:email', JiraService.authCallback);

// Redirect all non api requests to the 404
app.get('/*', (req, res) => {
    res.status(404).send('Unknown endpoint');
});