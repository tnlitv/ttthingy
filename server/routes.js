const router = require('express').Router();
const main = require('./controllers/main');
const calendar = require('./controllers/calendar');
const sheets = require('./controllers/spreadsheets');
const Jira = new require('./controllers/jira');
const JiraLinks = require('./providers/JiraLinks');
const JiraService = new require('./services/jira/authentification');
const handler = async function (req, res, fn) {
    try {
        if (!req.query.id) throw new Error('id required as query parameter');
        data = await fn(req.query.id);
        return res.json(data);
    } catch (e) {
        res.status(500).send(e.toString());
    }
};

router.get('/status', main.status);
router.get('/auth', calendar.getConcentPageUrl);
router.get('/oauth', calendar.saveTokens);

router.get('/sheets', (req, res) => handler(req, res, sheets.getSheetsSuggestions));
router.get('/events', (req, res) =>  handler(req, res, calendar.getEvents));
router.get('/jira/data', (req, res) => handler(req, res, Jira.getData));
router.get('/workflow', (req, res) => handler(req, res, main.workflow));

router.get(JiraLinks.auth(), JiraService.authenticate);
router.get('/jira/callback/:id', JiraService.authCallback);

// Redirect all non api requests to the 404
router.get('/*', (req, res) => {
    res.status(404).send('Unknown endpoint');
});

module.exports = router;