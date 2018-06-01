'use strict';
const mongoose = require('mongoose');
const main = require('./main');
const RowHandler = require('../services/spreadsheets/RowHandler');
const { get } = require('../services/jira/requests');
const options = require('../services/jira/options');
const JiraLinks = require('../providers/JiraLinks');
const utils = require('../services/utils');

const defaultHeader = [ 'day', 'name', 'total hours', 'LL h', 'ticket', 'RC h', 'ticket', 'MAT h', 'ticket', 'Others h',
    'ticket', 'Meeting h', 'Meeting description' ];

function getCurrentSheetExpectedName() {
    const date = new Date();
    const locale = 'en-us';
    const month = date.toLocaleString(locale, { month: 'long' });
    const year = date.toLocaleString(locale, { year: 'numeric' });
    return `${month}_${year}`;
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

async function setNewCurrentSheet(name, users) {
    users = users || [];
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
                                rowCount: 0,
                                columnCount: defaultHeader.length,
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
        const data = [];
        let rowIndex = 2;
        users.forEach(user => {
            const values = [];
            let rowsCount = 0;
            utils.getWorkingDaysArray().forEach(day => {
                values.push([day, user.real_name || 'unknown']);
                rowsCount++;
            });
            data.push({
                range: `A${rowIndex}`,
                majorDimension: 'ROWS',
                values,
            });
            rowIndex += rowsCount;
        });
        await RowHandler.valuesCall('batchUpdate', {
            resource: {
                valueInputOption: 'RAW',
                data,
            }
        });
        await RowHandler.call('batchUpdate', {
            resource: {
                requests: [
                    {
                    'addBanding': {
                        'bandedRange': {
                            'bandedRangeId': 1,
                            'range': {
                                'sheetId': sheet.properties.sheetId,
                                'startRowIndex': 1,
                                'endRowIndex': sheet.properties.gridProperties.rowCount,
                                'startColumnIndex': 0,
                                'endColumnIndex': 1,
                            },
                            rowProperties: {
                                'firstBandColor': {
                                    'red': 0.85,
                                    'green': 0.917,
                                    'blue': 0.827,
                                    'alpha': 1,
                                },
                                'secondBandColor': {
                                    'red': 0.917,
                                    'green': 0.817,
                                    'blue': 0.862,
                                    'alpha': 1,
                                }
                            }
                        },
                    },
                }, {
                    'addBanding': {
                        'bandedRange': {
                            'bandedRangeId': 2,
                            'range': {
                                'sheetId': sheet.properties.sheetId,
                                'startRowIndex': 1,
                                'endRowIndex': sheet.properties.gridProperties.rowCount,
                                'startColumnIndex': 2,
                                'endColumnIndex': 3,
                            },
                            columnProperties: {
                                'firstBandColor': {
                                    'red': 0.717,
                                    'green': 0.717,
                                    'blue': 0.717,
                                    'alpha': 1,
                                },
                                'secondBandColor': {
                                    'red': 0.717,
                                    'green': 0.717,
                                    'blue': 0.717,
                                    'alpha': 1,
                                }
                            }
                        },
                    },
                }, {
                        'addBanding': {
                            'bandedRange': {
                                'bandedRangeId': 3,
                                'range': {
                                    'sheetId': sheet.properties.sheetId,
                                    'startRowIndex': 1,
                                    'endRowIndex': sheet.properties.gridProperties.rowCount,
                                    'startColumnIndex': 3,
                                    'endColumnIndex': sheet.properties.gridProperties.columnCount,
                                },
                                columnProperties: {
                                    'firstBandColor': {
                                        'red': 0.937,
                                        'green': 0.937,
                                        'blue': 0.937,
                                        'alpha': 1,
                                    },
                                    'secondBandColor': {
                                        'red': 1,
                                        'green': 1,
                                        'blue': 1,
                                        'alpha': 1,
                                    }
                                }
                            },
                        },
                    }
                ]
            },
        });
        // console.log(res);
        return sheet;
    } catch (e) {
        throw e;
    }
}

const setNewValues = async function(sheetName, row) {
    const { data: { values } } = await RowHandler.valuesCall('get', { range: `${sheetName}!A2:Z1000` });
    let currentRange;
    for (let i = 0; i < values.length; i++) {
        console.log(values[i], row[0], row[1]);
        if (values[i][0] === row[0] && values[i][1] === row[1]) {
            currentRange = i+2;
            break;
        }
    }
    console.log(currentRange);
    return RowHandler.valuesCall('update', {
        range: `${sheetName}!A${currentRange}:Z${currentRange}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            range: `${sheetName}!A${currentRange}:Z${currentRange}`,
            majorDimension: 'ROWS',
            values: [row],
        }
    });
};

const tryCreateNewSpreadSheet = async function(users) {
    const expectedSheetName = getCurrentSheetExpectedName();
    let currentRes = await RowHandler.call('get', {
        ranges: [],
        includeGridData: false,
    });
    let currentSheet = currentRes.data.sheets.find(sht => sht.properties.title === expectedSheetName);

    if (!currentSheet) {
        currentSheet = await setNewCurrentSheet(expectedSheetName, users);
    }
    return currentSheet.properties;
};

const getSheetsSuggestions = async function (id) {
    try {
        const current = await tryCreateNewSpreadSheet();
        let header = await RowHandler.valuesCall('get', { range: `${current.title}!A1:Z1` });
        header = header.data.values[0];
        const token = await options.token(id);
        console.log(token);
        const userdata = await main.workflow(id);
        const { name } = await get(token, JiraLinks.username());
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

const updateRowSpreadsheet = async function (data, id) {
    try {
        const current = await tryCreateNewSpreadSheet();
        let header = await RowHandler.valuesCall('get', { range: `${current.title}!A1:Z1` });
        header = header.data.values[0];
        const token = await options.token(id);
        const { real_name } = await mongoose.connection.db.collection('users').findOne({id: token.id});
        let values = [];
        header.forEach((val, i) => {
            let value;
            switch (val) {
                case 'day':
                    value = new Date().getDate();
                    break;
                case 'name':
                    value = real_name;
                    break;
                case 'total hours':
                    value = +process.env.MAX_HOURS;
                    break;
                case 'ticket':
                case 'Meeting description':
                    value = findUD(data, header[i-1], true);
                    break;
                default:
                    value = findUD(data, header[i], false);
                    break;
            }
            values.push(String(value));
        });
        await setNewValues(current.title, values);
        // console.log('res', SheetResp);
        return SheetResp.updatedCells;
    } catch (e) {
        console.error(e);
        throw e;
    }
};

module.exports = {
    getSheetsSuggestions,
    updateRowSpreadsheet,
    tryCreateNewSpreadSheet,
};