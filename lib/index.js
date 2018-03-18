require('dotenv').config();

// function onInstallation(bot, installer) {
//     if (installer) {
//         bot.startPrivateConversation({user: installer}, function (err, convo) {
//             if (err) {
//                 console.log(err);
//             } else {
//                 convo.say('I am a bot that has just joined your team');
//                 convo.say('You must now /invite me to a channel so that I can be of use!');
//             }
//         });
//     }
// }

module.exports = function () {

    // if (process.env.TOKEN || process.env.SLACK_TOKEN) {
    //     //Treat this as a custom integration
    //     var customIntegration = require('./custom_integrations');
    //     var token = (process.env.TOKEN) ? process.env.TOKEN : process.env.SLACK_TOKEN;
    //     var controller = customIntegration.configure(token, config, onInstallation);
    // } else
    // if (process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET && process.env.SLACK_PORT) {
    //     //Treat this as an app
    //     var app = require('./apps');
    //     var controller = app.configure(process.env.SLACK_PORT, process.env.SLACK_CLIENT_ID, process.env.SLACK_CLIENT_SECRET, config, onInstallation);
    // } else {
    //     console.log('Error: If this is a custom integration, please specify TOKEN in the environment. ' +
    //         'If this is an app, please specify CLIENTID, CLIENTSECRET, and PORT in the environment');
    // }


    var Botkit = require('botkit');

    var bot_options = {
        clientId: process.env.clientId,
        clientSecret: process.env.clientSecret,
        scopes: ['bot'],
        // logLevel: 'debug',
        json_file_store: process.env.TOKEN, //use a different name if an app or CI,
    };
    var controller = Botkit.slackbot(bot_options);
    // var webserver = require(__dirname + '/express_webserver.js')(controller);
    // controller.setupWebserver(process.env.SLACK_PORT, function (err, webserver) {
    //     controller.createWebhookEndpoints(controller.webserver);
    //     console.log('configured');
    //     controller.createOauthEndpoints(controller.webserver, function (err, req, res) {
    //         if (err) {
    //             res.status(500).send('ERROR: ' + err);
    //         } else {
    //             res.send('Success!');
    //         }
    //     });
    // });

    var bot = controller.spawn({
        token: process.env.TOKEN
    });


    bot.startRTM(function (err, bot, payload) {
        if (err) {
            die(err);
        }
    });

    controller.on('rtm_open', function (bot) {
        console.log('** The RTM api just connected!');

        bot.startPrivateConversation({user: 'U9PGXKCE8'}, function (err, convo) {
            if (err)
                console.error(err);
            else {
                convo.ask({
                    text: "Here's some pretext",
                    attachments: [
                        {
                            title: 'Do you want to proceed?',
                            callback_id: '123',
                            attachment_type: 'default',
                            actions: [
                                {
                                    "name": "yes",
                                    "text": "Yes",
                                    "value": "yes",
                                    "type": "button",
                                },
                                {
                                    "name": "no",
                                    "text": "No",
                                    "value": "no",
                                    "type": "button",
                                }
                            ]
                        }
                    ]
                }, function (reply, convo) {
                    console.log('hereeeeeee');
                    convo.say("I'm here!")
                });
            }
        });

    });

    controller.on('rtm_close', function (bot) {
        console.log('** The RTM api just closed');
        // you may want to attempt to re-open
    });

    controller.on('bot_channel_join', function (bot, message) {
        bot.reply(message, "I'm here!")
    });

    controller.hears(['setup'], 'direct_message', function (bot, message) {
        // todo: rewrite this to try to get user from DB first
        bot.api.users.info({user: message.user}, function (err, response) {
            if (err) console.log(err);
            console.log(response);
            const email = response.user.profile.email;
            bot.reply(message, `Hello! Please use this link to connect your Jira and Google accounts: ${process.env.APP_URL}/auth?email=${email}`);

        });
    });

    controller.on('direct_message,mention,direct_mention', function (bot, message) {
        console.log("hears 'direct_message,mention,direct_mention' from " + message.user);
        bot.api.reactions.add({
            timestamp: message.ts,
            channel: message.channel,
            name: 'robot_face',
        }, function (err) {
            if (err) console.log(err);
            if (message.user === 'U9PGXKCE8') bot.reply(message, "Sure, master!");
            else bot.reply(message, "Only Tanya can tell me what to do!");
        });
    });

};
