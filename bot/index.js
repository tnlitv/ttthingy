// 'use strict';
//
// const Botkit = require('botkit');
// const events = require('./events');
// const BotkitStorage = require('botkit-storage-mongo');
// const config = {
//     clientId: process.env.clientId,
//     clientSecret: process.env.clientSecret,
//     scopes: ['bot'],
//     // logLevel: 'debug',
//     storage: BotkitStorage({mongoUri: process.env.MONGODB_URI}),
// };
//
// function startBot() {
//     const controller = Botkit.slackbot(config);
//     const bot = controller.spawn({
//         token: process.env.TOKEN
//     });
//
//     bot.startRTM(function (err) {
//         if (err) {
//             die(err);
//         }
//     });
//
//     events.listen(controller);
// }
//
// module.exports = startBot;
