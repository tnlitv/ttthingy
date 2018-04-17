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
        const users = await new Promise((resolve, reject) => {
            controller.storage.users.all((err, res) => {
               err ? reject(err) : resolve(res);
            });
        });

        const promises = [];
        cronjobs.status();
        [{ id: 'U7BSKA3AN' }].forEach(user => {
            cronjobs.sheduleNotifications(messages.ask.bind(this, bot, user.id));
            let promise = bot.api.im.open({ user }, (err, res) => {
                bot.send({
                    channel: res.channel.id,
                    user,
                    text: 'Hi, sweetheart. Hope you will have a nice day :3',
                }, (err) => err && console.log(err));
            });
            promises.push(promise);
        });
        await Promise.all(promises);
        // U7BSKA3AN
        // U9PGXKCE8
    });

    controller.on('rtm_close', function () {
        console.log('** The RTM api just closed, reopening');
        // reconnect after closing
        bot.startRTM(function (err) {
            if (err) {
                console.log('Error connecting bot to Slack:', err);
            }
        });
    });

    controller.hears(['calculate', 'schedule', 'log'], 'direct_message', messages.calculate);

    controller.hears(['Meeting', "MAT", "LL", "Other"], 'direct_message', messages.handleAnswer);

    controller.hears(['^start'], 'direct_message', (bot, message) => messages.onStart(bot, message, controller));

    controller.on(['direct_message', 'mention', 'direct_mention'], (bot, message) => messages.onDirectMessage(bot, message, controller));

    controller.on('interactive_message_callback', messages.interactiveMessageCb);
}

module.exports = {
    listen,
};