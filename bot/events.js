'use strict';

const mongoose = require('mongoose');
const Token = mongoose.model('Token');
mongoose.Promise = Promise;
function botPromisify(fn, argsObj) {
    return new Promise((resolve, reject) => {
        fn(argsObj, (err, res) => err ? reject(err) : resolve(res));
    });
}

async function listen(controller) {
    const bot = controller.spawn({ token: process.env.TOKEN });
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

    controller.on('interactive_message_callback', function (bot, message) {
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

            if (action == 'suggest' && payload.actions[0].name!=='dismiss') {
                reply = {
                    text: '<@' + user_id + '>, ok good',
                };
            } else {
                reply = {
                    text: '<@' + user_id + '>, well then go fuck yourself',
                };
            }

            bot.replyInteractive(message, reply);
            controller.storage.users.save(user);
        });

    });

// Handle events related to the websocket connection to Slack
    controller.on('rtm_open', async function () {
        console.log('** The RTM api just connected!');
    });

    controller.on('rtm_close', function () {
        console.log('** The RTM api just closed');
    });

    controller.hears(['^start'], 'direct_message', async (bot, message) => {
        try {
            // todo: rewrite this to try to get user from DB first
            let user = await botPromisify(controller.storage.users.get, message.user);
            if (!user) {
                const resp = await botPromisify(bot.api.users.info, {user: message.user});
                user = resp.user;
                controller.storage.users.save(user);
            }
            const {id} = user;
            bot.reply(message, {
                text: 'Hello! Please use this link to connect your Jira and Google accounts',
                attachments: [
                    {
                        'name': 'authorize',
                        'title': 'Authorize',
                        'title_link': `${process.env.APP_URL}/auth?id=${id}`,
                        'type': 'button',
                    }
                ],
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