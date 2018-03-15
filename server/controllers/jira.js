'use strict';

const User = require('mongoose').model('User');
const options = require('../services/jira/options');
const { get, post } = require('../services/jira/requests');
const JiraLinks = require('../providers/JiraLinks');
const JiraLabels = require('../providers/JiraLabels');

async function getData(req, res) {
    try {
        const {email} = req.query;
        if (!email) {
            throw new Error('email required');
        }
        const consumer = await options.consumer();
        const user = await options.user(email);

        const boards = await get(user, consumer, JiraLinks.boards('Odessa Team'));

        const ids = boards.values.map(b => b.id);
        const sprints = await Promise.all(
            ids.reduce((promises, id) => {
                promises.push(get(user, consumer, JiraLinks.sprints(id)));
                return promises;
            }, [])
        );

        const sprintsNames = sprints
            .map(item => item.values.map(spt => spt.name))
            .reduce((flat, item) => flat.concat(item), [])
            .join(',');

        const { name } = await get(user, consumer, JiraLinks.username());
        const response = await post(user, consumer, JiraLinks.issues(), {
            jql: JiraLinks.issuesJQL(name, JiraLabels[name], sprintsNames),
            fields: ['summary'],
        });
        const issues = response.issues
            .map(item => item.key)
            .join(',');
        return res.json(issues);
    } catch (e) {
        console.log(e);
        return res.status(500).send(e.toString());
    }
}

module.exports = {
    getData,
};