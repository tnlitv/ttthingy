var {google} = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL
);

const getEvents = async function (req, res) {
    try {
        // let code = '4/AAB8KyILG6oZ0cmANoLvHidGrzXjz_-GFiEmzXf5Xgcj2L_lqUxx4khfqxteZeCXowRYe2bBFwVjFdRmxOc2I3Q#';

        // oauth2Client.getToken(code, function (err, tokens) {
        // Now tokens contains an access_token and an optional refresh_token. Save them.
        // if (err) return res.send(err);
        let calendar = google.calendar('v3');

        let tokens = {
            "access_token": "ya29.Glt_Ba-JlqC_r3Ke2PVAV88x4931L9Kwn9fjjFj22h4sCGHORGZPTIx1eEv2K5ySuuAr9jbFiG901ZLaY8KuHq_-VtmGxuxPnpVJWT_zf3EL-f4-qntWU-ZB2shf",
            "token_type": "Bearer",
            "refresh_token": "1/ApdmDdtv6ne-L3QKY_oyly6rKD9lc9bCK6WV4N28guU",
            "expiry_date": 1521129565558
        };
        oauth2Client.setCredentials(tokens);
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
            return new Promise((resolve, reject) => {
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
                        console.log(err);
                        resolve([]);
                    }
                    resolve(response.data.items);
                })
            });
        });

        let events = await Promise.all(promises);
        events = Array.prototype.concat.apply([], events).filter(e => e.status !== 'cancelled');

        let duration = 0;
        events.forEach(e => {
            let start = (new Date(e.start.dateTime)).getTime();
            let end = (new Date(e.end.dateTime)).getTime();
            var timeDiff = Math.abs(end - start);
            var diffMinutes = Math.ceil(timeDiff / (1000 * 60));
            duration += diffMinutes;
        });

        return res.json({
            duration: {
                hours: Math.floor(duration / 60),
                minutes: (Math.round(duration / 15) * 15) % 60
            },
            events
        });
    } catch (e) {
        res.status(500).send(e);
    }
};

const getConcentPageUrl = function (req, res) {
// generate a url that asks permissions for Google+ and Google Calendar scopes
    var scopes = [
        'https://www.googleapis.com/auth/calendar',
    ];

    var url = oauth2Client.generateAuthUrl({
        // 'online' (default) or 'offline' (gets refresh_token)
        access_type: 'offline',
        // If you only need one scope you can pass it as a string
        scope: scopes,
        redirect_uri: process.env.GOOGLE_REDIRECT_URL,
        client_id: process.env.GOOGLE_CLIENT_ID
        // Optional property that passes state parameters to redirect URI
        // state: 'foo'
    });
    res.json({url});
};

module.exports = {
    getEvents,
    getConcentPageUrl
};