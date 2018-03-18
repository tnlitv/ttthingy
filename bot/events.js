'use strict';

const mongoose = require('mongoose');
const Token = mongoose.model('Token');
mongoose.Promise = Promise;
const main = require('../server/controllers/main');

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
    const out = [];
    let obj = {};
    text.split('\n').forEach(val => {
        const [key, value] = val.split(': ');
        obj[key] = value;
        if (key === 'desc') {
            out.push(obj);
            obj = {};
        }
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

    controller.on([
        'interactive',
        'interactive_message',
        'interactive_message_callback'
    ], function (bot, message) {
        const ids = message.callback_id.split(/\-/);
        const user_id = ids[0];
        const action = ids[1];
        const payload = JSON.parse(message.payload);

        controller.storage.users.get(user_id, function (err, user) {
            let reply;
            if (!user) {
                user = {
                    id: user_id,
                    list: []
                }
            }

            if (action == 'suggest' && payload.actions[0].name !== 'dismiss') {
                reply = {
                    text: '<@' + user_id + '>, ok good',
                };

                bot.replyInteractive(message, reply);
            } else {
                var dialog = bot.createDialog(
                    'Update time',
                    'update-suggestions',
                    'Submit'
                )
                    .addText('Meetings', 'meetings', '1')
                    .addText('MAT Project', 'mat', '3:30 - 88, 99')
                    .addText('LL Project', 'll', '3:30 - 33, 55')
                    .addText('Other projects', 'other', '0');

                bot.replyWithDialog(message, dialog.asObject());
            }

            controller.storage.users.save(user);
        });

    });

// Handle events related to the websocket connection to Slack
    controller.on('rtm_open', async (bot) => {
        // try {
        //     console.log('** The RTM api just connected!');
        //     var dialog = bot.createDialog(
        //             'Update time',
        //             'update-suggestions',
        //             'Submit'
        //         )
        //         .addText('Meetings', 'meetings', '1')
        //         .addText('MAT Project', 'mat', '3:30 - 88, 99')
        //         .addText('LL Project', 'll', '3:30 - 33, 55')
        //         .addText('Other projects', 'other', '0');
        //
        //     bot.replyWithDialog(message, dialog.asObject());
        // } catch (e) {
        //     console.error(e);
        // }
        bot.startPrivateConversation({user: 'U7BSKA3AN'}, async (err, conv) => {
            try {
                if (err) {
                    throw err;
                }
                const values = await main.workflow('U7BSKA3AN');
                const fields = jsonToValues(values);
                conv.ask({
                    attachments: [{
                        title: 'Is it OKAY, BITCH?',
                        callback_id: 'U7BSKA3AN-suggest',
                        attachment_type: 'default',
                        // fields: fields,
                        actions: [{
                                "name": "ok",
                                "text": ":white_check_mark: OK",
                                "value": "flag",
                                "type": "button",
                                "confirm": {
                                    "title": "Are you sure?",
                                    "text": "This will do something!",
                                    "ok_text": "Yes",
                                    "dismiss_text": "No"
                                }
                            },
                            {
                                "text": "Fuck no!",
                                "name": "dismiss",
                                "value": "delete",
                                "style": "danger",
                                "type": "button",
                        }],
                    }]
                }, );
            } catch (e) {
                console.error(e);
            }
        });
    });

    controller.on('rtm_close', function () {
        console.log('** The RTM api just closed');
    });

    controller.hears(['hello'], 'direct_message', async (bot, message) => {
        try {
            var reply = {
                text: 'Hue moe',
                attachments: [],
            }

            reply.attachments.push({
                title: "Blablabla your suggestions are blabalblabla",
                callback_id: message.user + '-' + 'suggest',
                attachment_type: 'default',
                actions: [
                    {
                        "name": "ok",
                        "text": ":white_check_mark: OK",
                        "value": "flag",
                        "type": "button",
                        "confirm": {
                            "title": "Are you sure?",
                            "text": "This will do something!",
                            "ok_text": "Yes",
                            "dismiss_text": "No"
                        }
                    },
                    {
                        "text": "Fuck no!",
                        "name": "dismiss",
                        "value": "delete",
                        "style": "danger",
                        "type": "button",
                    }
                ]
            });


            bot.reply(message, reply);

        } catch (e) {
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