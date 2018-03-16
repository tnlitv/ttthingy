let {google} = require('googleapis');
let sheets = google.sheets('v4');

const scopes = [
    'https://www.googleapis.com/auth/spreadsheets'
];

const getSpreadsheet = async function (req, res) {
    try {
        let key = require('../../ttthingy-service-account-key.json');

        let jwtClient = new google.auth.JWT({
                email: key.client_email,
                key: key.private_key,
                scopes: 'https://www.googleapis.com/auth/spreadsheets'
            }
        );

        await new Promise((resolve, reject) => {
            jwtClient.authorize((err, tokens) => {
                if (err) reject(err);
                resolve(tokens);
            });
        });

        let spreadsheet = await new Promise((resolve, reject) => {
            sheets.spreadsheets.values.get({
                auth: jwtClient,
                spreadsheetId: '1vxokkFR0GqdHe1865hwmlut8NdU7g8meMpsHuo7vDu8',
                range: 'A1:B1',
            }, function (err, resp) {
                if (err) reject(err);
                resolve(resp.data);
            })
        });

        let rows = spreadsheet.values;
        return res.json({rows});
    } catch (e) {
        console.log(e);
        return res.status(500).send(e.errors);
    }
};

module.exports = {
    getSpreadsheet
};