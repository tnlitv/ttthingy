/**
 * Helpers for configuring a bot as a custom integration
 * https://api.slack.com/custom-integrations
 */

var Botkit = require('botkit');

function die(err) {
    console.log(err);
}

module.exports = {
    configure: function (token, config, onInstallation) {

        var controller = Botkit.slackbot(config);

        var bot = controller.spawn({
            token: token
        });


        bot.startRTM(function (err, bot, payload) {

            if (err) {
                die(err);
            }

            if(onInstallation) onInstallation(bot);

        });

        return controller;
    }
};