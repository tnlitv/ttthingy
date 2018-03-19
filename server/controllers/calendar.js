'use strict';

const {google} = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const mongoose = require('mongoose');
const Token = mongoose.model('Token');
const JiraLinks = require('../providers/JiraLinks');
const oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.APP_URL + process.env.GOOGLE_REDIRECT_PATHNAME
);

mongoose.Promise = Promise;

const getEvents = async function (id) {
    try {
        let calendar = google.calendar('v3');
        const { googleTokens } = await Token.findOne({id});
        oauth2Client.setCredentials(googleTokens);
        const calendarResponse = await new Promise((resolve, reject) => {
            let args = {
                auth: oauth2Client,
            };
            calendar.calendarList.list(args, function (err, response) {
                if (err) reject(err);
                resolve(response);
            });
        });

        let calendarsList = calendarResponse.data.items;

        let promises = calendarsList.map(calendarItem => {
            return new Promise((resolve) => {
                let args = {
                    auth: oauth2Client,
                    setting: "timezone",
                    showDeleted: false,
                    timeMin: (new Date((new Date()).setHours(0, 0, 0, 0))).toISOString(),
                    timeMax: (new Date((new Date()).setHours(24, 0, 0, 0))).toISOString(),
                    calendarId: calendarItem.id
                };
                calendar.events.list(args, function (err, response) {
                    if (err) {
                        console.log(err.toString());
                        resolve([]);
                    }
                    resolve(response.data.items);
                });
            });
        });

        let events = await Promise.all(promises);
        events = Array.prototype.concat.apply([], events).filter(e => {
            const escaped = !!process.env.ESCAPED_EVENTS ? process.env.ESCAPED_EVENTS.split(',').join('|') : '';
            if (escaped !== '') {
                return e.status !== 'cancelled' && !new RegExp(escaped).test(e.summary);
            }
            return e.status !== 'cancelled';
        });

        let duration = 0;
        events.forEach(e => {
            let start = (new Date(e.start.dateTime)).getTime();
            let end = (new Date(e.end.dateTime)).getTime();
            var timeDiff = Math.abs(end - start);
            var diffMinutes = Math.ceil(timeDiff / (1000 * 60));
            duration += diffMinutes;
        });
        events = events.map(event => event.summary);

        return {
            'Meeting h': (Math.round(duration / 30) * 30) / 60,
            desc: events.join(','),
        };
    } catch (e) {
        console.error(e.toString());
        return {
            'Meeting h': 0,
            desc: '',
        };
    }
};

const getConcentPageUrl = function (req, res) {
// generate a url that asks permissions for Google+ and Google Calendar scopes
    const {query: {id}} = req;
    const scopes = [
        'https://www.googleapis.com/auth/calendar',
    ];

    const url = oauth2Client.generateAuthUrl({
        // 'online' (default) or 'offline' (gets refresh_token)
        access_type: 'offline',
        // If you only need one scope you can pass it as a string
        scope: scopes,
        redirect_uri: process.env.APP_URL + process.env.GOOGLE_REDIRECT_PATHNAME,
        client_id: process.env.GOOGLE_CLIENT_ID,
        // Optional property that passes state parameters to redirect URI
        state: id,
    });
    res.redirect(url);
};

const saveTokens = async function (req, res) {
    try {
        const {query: {code, state}} = req;
        const {tokens} = await oauth2Client.getToken(code);
        const saved = await Token.findOne({id: state});
        const googleTokens = saved ? Object.assign({}, saved.googleTokens, tokens) : tokens;
        await Token.set(state, {
            id: state,
            googleTokens,
        });
        res.redirect(JiraLinks.auth() + JiraLinks.authQuery(state));
    } catch (e) {
        console.log(e);
        res.status(500).send(e);
    }
};

module.exports = {
    getEvents,
    getConcentPageUrl,
    saveTokens,
};