'use strict';
const main = require('./main');
const RowHandler = require('../services/spreadsheets/RowHandler');
const { get } = require('../services/jira/requests');
const options = require('../services/jira/options');
const JiraLinks = require('../providers/JiraLinks');

const defaultHeader = [ 'day', 'name', 'total hours', 'LL h', 'ticket', 'RC h', 'ticket', 'MAT h', 'ticket', 'Others h',
    'ticket', 'Meeting h', 'Meeting description' ];

function getCurrentSheetExpectedName() {
    const date = new Date();
    const locale = 'en-us';
    const month = date.toLocaleString(locale, { month: 'long' });
    const year = date.toLocaleString(locale, { year: 'numeric' });
    return `${month}_${year}`;
}

async function setNewCurrentSheet(name) {
    try {
        const sheetRes = await RowHandler.call('batchUpdate', {
            resource: {
                requests: [{
                    addSheet: {
                        properties: {
                            title: name,
                            index: 0,
                            sheetType: 'GRID',
                            gridProperties: {
                                rowCount: 4000,
                                columnCount: 26,
                            },
                        },
                    }
                }],
            },
        });
        const sheet = sheetRes.data.replies[0].addSheet;
        await RowHandler.valuesCall('update', {
            range: `A1`,
            valueInputOption: 'RAW',
            resource: {
                values: [defaultHeader]
            }
        });
        return sheet;
    } catch (e) {
        throw e;
    }
}

function findUD(data, key, isValue) {
    const item = data.find(item => {
        return Object.keys(item).find(k => k === key);
    });
    switch (true) {
        case item && isValue:
            return item.desc;
        case item && !isValue:
            return item[key];
        case !item && isValue:
            return '';
        case !item && !isValue:
            return 0;
        default:
            throw new Error('Unhandled case');
    }
}

const getSheetsSuggestions = async function (email) {
    try {
        const expectedSheetName = getCurrentSheetExpectedName();
        let currentSheet = await RowHandler.call('get', {
            ranges: [],
            includeGridData: false,
        });
        currentSheet = currentSheet.data.sheets.find(sht => sht.properties.title === expectedSheetName);

        if (!currentSheet) {
            currentSheet = await setNewCurrentSheet(expectedSheetName);
        }
        const current = currentSheet.properties;
        let header = await RowHandler.valuesCall('get', { range: `${current.title}!A1:Z1` });
        header = header.data.values[0];
        const user = await options.user(email);
        const userdata = await main.workflow(email);
        const { name } = await get(user, JiraLinks.username());
        let values = [];
        header.forEach((val, i) => {
            let value;
            switch (val) {
                case 'day':
                    value = new Date().getDate();
                    break;
                case 'name':
                    value = name;
                    break;
                case 'total hours':
                    value = +process.env.MAX_HOURS;
                    break;
                case 'ticket':
                case 'Meeting description':
                    value = findUD(userdata, header[i-1], true);
                    break;
                default:
                    value = findUD(userdata, header[i], false);
                    break;
            }
            values.push(value);
        });

        return values;
    } catch (e) {
        console.log(e);
        throw e;
    }
};

let addRowToSpreadsheet = async function (values) {
    try {
        const SheetResp = await RowHandler.valuesCall('append', {
            range: 'A1:A4000',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: values
            }
        });
        return SheetResp.updatedCells;
    } catch (e) {
        console.error(e);
        throw e;
    }
};

module.exports = {
    getSheetsSuggestions
};