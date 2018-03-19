'use strict';

const mongoose = require('mongoose');
const Token = mongoose.model('Token');
const Project = require('../server/providers/Projects');
mongoose.Promise = Promise;
const main = require('../server/controllers/main');
const sheet = require('../server/controllers/spreadsheets');

function botPromisify(fn, argsObj) {
    return new Promise((resolve, reject) => {
        fn(argsObj, (err, res) => err ? reject(err) : resolve(res));
    });
}

function jsonToValues(json) {
    const out = [];
    let obj = {};
    json.forEach(val => {
        Object.keys(val).forEach(key => {
            const isDesc = key === 'desc';
            obj[isDesc ? 'value': 'title'] = isDesc ?
                `${val[key]}` :
                `${key}: ${val[key]}`;
            if (key === 'desc') {
                out.push(obj);
                obj = {};
            }
        });
    });
    return out;
}

function textToJson(text) {
    try {
        const out = [];
        let obj = {};
        text.split('\n').forEach(val => {
            const [project, hours, ...desc] = val.split(' ');
            obj[Project(project)] = hours;
            obj.desc = desc.join(' ');
            out.push(obj);
            obj = {};
        });
        return out;
    } catch (e) {
        throw new Error('invalid input');
    }
}

function fieldsToJson(fields) {
    const out = [];
    fields.forEach(f => {
       const [key, val] = f.title.split(': ');
       const desc = f.value;
       let obj = {};
       obj[key] = val;
       obj.desc = desc;
       out.push(obj);
    });
    return out;
}

async function listen(controller) {
    const bot = controller.spawn({token: process.env.TOKEN});
    const team = await botPromisify(controller.storage.teams.get, 'T0831CCKU');
    if (!team) {
        await botPromisify(controller.storage.teams.save, {
            'id': 'T0831CCKU',
            'domain': 'dagbladetua',
            'token': process.env.TOKEN
        });
    }
    bot.startRTM(function (err) {
        if (err) {
            console.log('Error connecting bot to Slack:', err);
        }
    });

    controller.on(
        'interactive_message_callback', async (bot, message) => {
            try {
                const ids = message.callback_id.split(/\-/);
                const user_id = ids[0];
                const action = ids[1];
                const payload = JSON.parse(message.payload);

                let reply;
                if (action == 'suggest' && payload.actions[0].name !== 'change') {
                    reply = {
                        text: '<@' + user_id + '>, submitted to spreadsheet',
                    };

                    let values = fieldsToJson(message.original_message.attachments[0].fields);
                    sheet.addRowToSpreadsheet(values, user_id);
                    bot.replyInteractive(message, reply);

                } else {
                    bot.replyInteractive(message,
                        'Enter your data in the following format: ' +
                        '\nProject/\'Meetings\' hours comment ' +
                        '\nProject/\'Meetings\' hours comment ');
                }
            } catch (e) {
                console.error(e);
            }
    });

// Handle events related to the websocket connection to Slack
    controller.on('rtm_open', async (bot) => {
        console.log('** The RTM api just opened');
    });

    controller.on('rtm_close', function () {
        console.log('** The RTM api just closed');
    });

    controller.hears(['calculate', 'schedule', 'log'], 'direct_message', async (bot, message) => {
        bot.startPrivateConversation(message, async (err, conv) => {
            try {
                if (err) {
                    throw err;
                }
                const values = await main.workflow(message.user);
                const fields = jsonToValues(values);
                conv.ask({
                    attachments: [{
                        title: 'Is this ok?',
                        callback_id: `${message.user}-suggest`,
                        attachment_type: 'default',
                        fields: fields,
                        actions: [ {
                            "name": "ok",
                            "text": ":white_check_mark: OK",
                            "value": "flag",
                            "type": "button",
                            "confirm": {
                                "title": "Are you sure?",
                                "ok_text": "Yes",
                                "dismiss_text": "No"
                            }
                        }, {
                            "text": "Change",
                            "name": "change",
                            "value": "change",
                            "style": "danger",
                            "type": "button",
                        }
                        ],
                    }]
                }, );
            } catch (e) {
                console.error(e);
            }
        });
    });

    controller.hears(['Meeting', "MAT", "LL", "Other"], 'direct_message', async (bot, message) => {
        try {
            let values = textToJson(message.text);
            const fields = jsonToValues(values);
            let reply = {
                attachments: [{
                    title: 'Is this ok?',
                    callback_id: `${message.user}-suggest`,
                    attachment_type: 'default',
                    fields: fields,
                    actions: [ {
                        "name": "ok",
                        "text": ":white_check_mark: OK",
                        "value": "flag",
                        "type": "button",
                    }, {
                        "text": "Change",
                        "name": "change",
                        "value": "change",
                        "style": "danger",
                        "type": "button",
                    }
                    ],
                }]};
            bot.reply(message, reply);
        } catch (e) {
            bot.reply(message, {
                text: 'Error occured, try again or contact <@Nik>',
            });
            console.error(e);
        }
    });
            // todo: rewrite this to try to get user from DB first
controller.hears(['^start'], 'direct_message', async (bot, message) => {
        try {
            // todo: rewrite this to try to get user from DB first
            let user = await botPromisify(controller.storage.users.get, message.user);
            if (!user) {
                const resp = await botPromisify(bot.api.users.info, {user: message.user});
                user = resp.user;
                await controller.storage.users.save(user);
            }

            const {id} = user;
            bot.reply(message, {
                text: 'Hello! Please use this link to connect your Jira and Google accounts',
                attachments: [{
                    'name': 'authorize',
                    'title': 'Authorize',
                    'title_link': `${process.env.APP_URL}/auth?id=${id}`,
                    'type': 'button',
                }],
            });
        } catch (e) {
            console.error(e);
        }
    });

    // controller.hears('^stop', 'direct_message', function (bot, message) {
    //     bot.reply(message, 'Goodbye');
    // });

    controller.on(['direct_message', 'mention', 'direct_mention'], async (bot, message) => {
        try {
            let [user, token] = await Promise.all([
                botPromisify(controller.storage.users.get, message.user),
                Token.findOne({id: message.user}),
            ]);
            if (!user || !token) {
                return bot.reply(message, 'Type `start` to complete authorization');
            }
            return bot.reply(message, 'Type `calculate` to track your work');
        } catch (e) {
            console.error(e);
        }
    });
}

module.exports = {
    listen,
};