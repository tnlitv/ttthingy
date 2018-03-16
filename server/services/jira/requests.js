'use strict';
const options = require('./options');
const OAuth = require('oauth').OAuth;

OAuth.prototype.get = async function(url, oauth_token, oauth_token_secret, callback) {
    return this._performSecureRequest(
        oauth_token,
        oauth_token_secret,
        'GET',
        url,
        null,
        '',
        'application/json',
        callback,
    );
};

OAuth.prototype.post = async function(url, oauth_token, oauth_token_secret, post_body, callback) {
    return this._performSecureRequest(
        oauth_token,
        oauth_token_secret,
        'POST',
        url,
        null,
        post_body,
        'application/json',
        callback,
    );
};

async function get (user, url) {
    try {
        const consumer = await options.consumer();
        return new Promise((resolve, reject) => {
            consumer.get(
                `${process.env.JIRA_ENDPOINT}${url}`,
                user.jiraTokens.accessToken,
                user.jiraTokens.accessTokenSecret,
                function (err, data) {
                    if (err) {
                        reject(err);
                    }
                    resolve(JSON.parse(data));
                },
            );
        });
    } catch (e) {
        console.error(e);
    }
}

async function post (user, url, data) {
    try {
        const consumer = await options.consumer();
        return new Promise((resolve, reject) => {
            consumer.post(
                `${process.env.JIRA_ENDPOINT}${url}`,
                user.jiraTokens.accessToken,
                user.jiraTokens.accessTokenSecret,
                JSON.stringify(data),
                function (err, data) {
                    if (err) {
                        reject(err);
                    }
                    resolve(JSON.parse(data));
                },
            );
        });
    } catch (e) {
        console.error(e);
    }
}

module.exports = {
    get,
    post,
};
