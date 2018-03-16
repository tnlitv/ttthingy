const app = require('./config.js');
const main = require('./controllers/main.js');
const calendar = require('./controllers/calendar.js');
const sheets = require('./controllers/spreadsheets.js');
const Jira = new require('./controllers/jira');
const JiraLinks = require('./providers/JiraLinks');
const JiraService = new require('./services/jira/authentification');

app.get('/status', main.status);

app.get('/events', calendar.getEvents);
app.get('/url', calendar.getConcentPageUrl);
app.get('/oauth', calendar.saveTokens);
app.get('/sheets', sheets.getSpreadsheet);

app.get('/jira/data', Jira.getData);
app.get(JiraLinks.auth(), JiraService.authenticate);
app.get('/jira/callback/:email', JiraService.authCallback);

// Redirect all non api requests to the 404
app.get('/*', (req, res) => {
    res.status(404).send('Unknown endpoint');
});