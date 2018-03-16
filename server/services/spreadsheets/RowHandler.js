'use strict';
const {google} = require('googleapis');
const sheets = google.sheets('v4');
const key = require('../../../ttthingy-service-account-key.json');

async function authorize() {
    try {
        const jwtClient = new google.auth.JWT({
                email: key.client_email,
                key: key.private_key,
                scopes: process.env.GOOGLE_SHEETS_SCOPE,
            },
        );

        await jwtClient.authorize();
        return jwtClient;
    } catch (e) {
        throw e;
    }
}

async function valuesCall(method, params) {
    const auth = await authorize();
    return new Promise((resolve, reject) => {
        sheets.spreadsheets.values[method](Object.assign({}, {
            auth,
            spreadsheetId: process.env.SPREADSHEET_ID,
        }, params), (err, resp) => {
            if (err) reject(err);
            resolve(resp);
        });
    });
}

async function call(method, params) {
    const auth = await authorize();
    return new Promise((resolve, reject) => {
        sheets.spreadsheets[method](Object.assign({}, {
            auth,
            spreadsheetId: process.env.SPREADSHEET_ID,
        }, params), (err, resp) => {
            if (err) reject(err);
            resolve(resp);
        });
    });
}

module.exports = {
    authorize,
    valuesCall,
    call,
};
