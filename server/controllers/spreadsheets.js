let {google} = require('googleapis');
let sheets = google.sheets('v4');

const scopes = [
    'https://www.googleapis.com/auth/spreadsheets'
];

const getSpreadsheet = async function (req, res) {
    try {
        let rows = [
            ["2", "Tanya", "8", "", "", "", "", "MAT-88"]
        ];
        let updatedCells = await addRowToSpreadsheet(rows);
        return res.json({updatedCells});
    } catch (e) {
        console.log(e);
        return res.status(500).send(e.errors);
    }
};

let addRowToSpreadsheet = async function (values) {
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
        sheets.spreadsheets.values.append({
            auth: jwtClient,
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: 'A1:A4000',
            valueInputOption: "USER_ENTERED",
            resource: {
                values: values
            }
        }, (err, resp) => {
            if (err) reject(err);
            resolve(resp);
        })
    });

    return spreadsheet.updatedCells;
};

module.exports = {
    getSpreadsheet
};