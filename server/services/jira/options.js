'use strict';

const fs = require('fs');
const {promisify} = require('util');
const User = require('mongoose').model('User');
const OAuth = require('oauth').OAuth;

async function consumer() {
    const base_url = process.env.JIRA_ENDPOINT;
    const key = await promisify(fs.readFile)(process.env.PRIVATE_KEY_PATH, 'utf8');

    return new OAuth(
        `${base_url}/plugins/servlet/oauth/request-token`,
        `${base_url}/plugins/servlet/oauth/access-token`,
        process.env.KEY_NAME,
        key,
        process.env.JIRA_API_VERSION,
        `${process.env.APP_URL}/jira/callback/`,
        'RSA-SHA1'
    );
}

function user(email) {
    return User.findOne({email});
}

module.exports = {
    consumer,
    user,
};
