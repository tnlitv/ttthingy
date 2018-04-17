'use strict';

const fs = require('fs');
const mongoose = require('mongoose');
const Token = mongoose.model('Token');
const {promisify} = require('util');
const OAuth = require('oauth').OAuth;

function tokenRequestHandler (oa) {
    return new Promise((resolve, reject) => {
        oa.getOAuthRequestToken(function (error, oauthToken, oauthTokenSecret) {
            if (error) {
                reject(error.data);
            } else {
                resolve({
                    oauthToken,
                    oauthTokenSecret,
                });
            }
        });
    });
}

function oauthCallbackHandler (oa, req) {
    return new Promise((resolve, reject) => {
        oa.getOAuthAccessToken(
            req.session.oauth_token,
            req.session.oauth_token_secret,
            req.query['oauth_verifier'],
            function (error, accessToken, accessTokenSecret) {
                if (error) {
                    reject(error.data);
                } else {
                    resolve({
                        accessToken,
                        accessTokenSecret,
                    });
                }
            }
        );
    });
}

async function authenticate(req, res) {
    try {
        const {id} = req.query;
        const key = await promisify(fs.readFile)(process.env.PRIVATE_KEY_PATH, 'utf8');
        const base_url = process.env.JIRA_ENDPOINT;
        const oa = new OAuth(
            base_url + '/plugins/servlet/oauth/request-token',
            base_url + '/plugins/servlet/oauth/access-token',
            process.env.KEY_NAME,
            key,
            process.env.JIRA_API_VERSION,
            `${process.env.APP_URL}/jira/callback/${id}`,
            'RSA-SHA1'
        );

        const tokenData = await tokenRequestHandler(oa);
        req.session.oa = oa;
        req.session.oauth_token = tokenData.oauthToken;
        req.session.oauth_token_secret = tokenData.oauthTokenSecret;
        return res.redirect(base_url + '/plugins/servlet/oauth/authorize?oauth_token=' + tokenData.oauthToken);
    } catch (e) {
        console.error('authentication error', e);
        return res.send(e);
    }
}

async function authCallback (req, res) {
    try {
        const { id } = req.params;
        const key = await promisify(fs.readFile)(process.env.PRIVATE_KEY_PATH, 'utf8');
        const oa = new OAuth(
            req.session.oa._requestUrl,
            req.session.oa._accessUrl,
            req.session.oa._consumerKey,
            key,
            req.session.oa._version,
            req.session.oa._authorize_callback,
            req.session.oa._signatureMethod
        );
        const tokenData = await oauthCallbackHandler(oa, req);
        // store the access token in the session
        req.session.oauth_access_token = tokenData.accessToken;
        req.session.oauth_access_token_secret = tokenData.accessTokenSecret;

        await Token.set(id, {
            id,
            jiraTokens: tokenData,
        });
        res.send('All done, you`re great <3');
    } catch (e) {
        console.error('authenticate callback error', e);
        return res.send(e.toString());
    }
}

module.exports = {
    authenticate,
    authCallback,
};