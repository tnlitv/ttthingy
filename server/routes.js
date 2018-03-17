const app = require('./config');
const main = require('./controllers/main');
const calendar = require('./controllers/calendar');
const sheets = require('./controllers/spreadsheets');
const Jira = new require('./controllers/jira');
const JiraLinks = require('./providers/JiraLinks');
const JiraService = new require('./services/jira/authentification');
const handler = async function (req, res, fn) {
    try {
        if (!req.query.email) throw new Error('email required as query parameter');
        data = await fn(req.query.email);
        return res.json(data);
    } catch (e) {
        res.status(500).send(e);
    }
}

app.get('/status', main.status);
app.get('/auth', calendar.getConcentPageUrl);
app.get('/oauth', calendar.saveTokens);

app.get('/sheets', (req, res) => handler(req, res, sheets.getSheetsSuggestions));
app.get('/events', (req, res) =>  handler(req, res, calendar.getEvents));
app.get('/jira/data', (req, res) => handler(req, res, Jira.getData));
app.get('/workflow', (req, res) => handler(req, res, main.workflow));

app.get(JiraLinks.auth(), JiraService.authenticate);
app.get('/jira/callback/:email', JiraService.authCallback);

// Redirect all non api requests to the 404
app.get('/*', (req, res) => {
    res.status(404).send('Unknown endpoint');
});