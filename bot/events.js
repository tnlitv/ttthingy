'use strict';

const mongoose = require('mongoose');
const Token = mongoose.model('Token');
mongoose.Promise = Promise;

const {botPromisify} = require('../lib/utils');
const messages = require('../lib');
const cronjobs = require('../lib/cronjobs');

async function listen(controller) {
    const bot = controller.spawn({
        token: process.env.TOKEN,
        retry: true
    });
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

    controller.on('rtm_open', async (bot) => {
        console.log('** The RTM api just opened');
        try {
            const users = await new Promise((resolve, reject) => {
                controller.storage.users.all((err, res) => {
                    err ? reject(err) : resolve(res);
                });
            });

            cronjobs.status();

            const promises = [];
            for (let user of users) {
                // ask about saving users results
                cronjobs.createCustomCronJob('0 17 * * 1-5', messages.ask.bind(this, bot, user.id));
                // carefully, Cinderella, after midnight your app will turn into the pumpkin
                cronjobs.createCustomCronJob('0 0 * * 1-5', bot.destroy.bind(bot));

                if (user.id !== 'U7BSKA3AN') {
                    continue;
                }
                let promise = bot.api.im.open({user: user.id}, (err, res) => {
                    bot.send({
                        channel: res.channel.id,
                        user,
                        text: 'Hi, sweetheart! It`s my test run. Hope you will have a nice day :)',
                    }, (err) => err && console.log(err));
                });
                promises.push(promise);
            }
            await Promise.all(promises);
            // U7BSKA3AN NIK
            // U9PGXKCE8 TANYA
        } catch (e) {
            console.error(e);
        }
    });

    controller.on('rtm_close', function () {
        console.log('** The RTM api just closed, reopening');
        // reconnect after closing
        bot.startRTM(function (err) {
            if (err) {
                console.log('Error connecting bot to Slack:', err);
            } else {
                bot.api.im.open({user: 'U7BSKA3AN'}, (err, res) => {
                    bot.send({
                        channel: res.channel.id,
                        user: 'U7BSKA3AN',
                        text: 'Master, I was closed and restarted',
                    }, (err) => err && console.log(err));
                });
            }
        });
    });

    controller.hears(['calculate', 'schedule', 'log'], 'direct_message', (bot, message) => messages.ask(bot, message.user));

    controller.hears(['Meeting', "MAT", "LL", "Other"], 'direct_message', messages.handleAnswer);

    controller.hears(['^start'], 'direct_message', (bot, message) => messages.onStart(bot, message, controller));

    controller.on(['direct_message', 'mention', 'direct_mention'], (bot, message) => messages.onDirectMessage(bot, message, controller));

    controller.on('interactive_message_callback', messages.interactiveMessageCb);
}

module.exports = {
    listen,
};