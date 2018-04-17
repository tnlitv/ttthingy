const main = require('../server/controllers/main');
const sheet = require('../server/controllers/spreadsheets');

const mongoose = require('mongoose');
const Token = mongoose.model('Token');
mongoose.Promise = Promise;
const {botPromisify, fieldsToJson, jsonToValues, textToJson, fieldsToText} = require('../lib/utils');

async function ask(bot, user) {
    bot.startPrivateConversation({ user }, async (err, conv) => {
        try {
            if (err) {
                throw err;
            }
            const values = await main.workflow('U7BSKA3AN');
            const fields = jsonToValues(values);
            conv.ask({
                attachments: [{
                    title: 'Is this ok?',
                    callback_id: `${user}-suggest`,
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
}

async function onStart(bot, message, controller) {
    try {
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
}

async function calculate(bot, message) {
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
}

async function handleAnswer(bot, message) {
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
}

async function onDirectMessage(bot, message, controller) {
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
}

async function interactiveMessageCb(bot, message) {
    try {
        const ids = message.callback_id.split(/\-/);
        const user_id = ids[0];
        const action = ids[1];
        const payload = JSON.parse(message.payload);

        let values = fieldsToJson(message.original_message.attachments[0].fields);
        let reply;
        if (action == 'suggest' && payload.actions[0].name !== 'change') {
            reply = {
                text: '<@' + user_id + '>, submitted to spreadsheet',
            };

            sheet.addRowToSpreadsheet(values, user_id);
            bot.replyInteractive(message, reply);

        } else {
            bot.replyInteractive(message, 'Enter your data in the following format: \n' + fieldsToText(values));
        }
    } catch (e) {
        console.error(e);
    }
}



module.exports = {
    calculate,
    ask,
    handleAnswer,
    onDirectMessage,
    interactiveMessageCb,
    onStart,
};
