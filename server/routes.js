const app = require('./config');
const main = require('./controllers/main');
const calendar = require('./controllers/calendar');
const sheets = require('./controllers/spreadsheets');
const Jira = new require('./controllers/jira');
const JiraLinks = require('./providers/JiraLinks');
const JiraService = new require('./services/jira/authentification');

app.get('/status', main.status);
app.get('/auth', calendar.getConcentPageUrl);
app.get('/oauth', calendar.saveTokens);

app.get('/sheets', async (req, res) => {
    data = await sheets.getSheetsSuggestions(req.query.email);
    return res.json(data);
});
app.get('/events', async (req, res) => {
    data = await calendar.getEvents(req.query.email);
    return res.json(data);
});
app.get('/jira/data', async (req, res) => {
    data = await Jira.getData(req.query.email);
    return res.json(data);
});
app.get('/workflow', async (req, res) => {
    data = await main.workflow(req.query.email);
    return res.json(data);
});

app.get(JiraLinks.auth(), JiraService.authenticate);
app.get('/jira/callback/:email', JiraService.authCallback);

// Redirect all non api requests to the 404
app.get('/*', (req, res) => {
    res.status(404).send('Unknown endpoint');
});