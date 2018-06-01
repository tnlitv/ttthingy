'use strict';

const Token = require('mongoose').model('Token');
const options = require('../services/jira/options');
const { get, post } = require('../services/jira/requests');
const JiraLinks = require('../providers/JiraLinks');
const JiraLabels = require('../providers/JiraLabels');

async function getData(id) {
    try {
        if (!id) {
            throw new Error('id required');
        }
        const token = await options.token(id);

        const boards = await get(token, JiraLinks.boards('Odessa Team'));

        const ids = boards.values.map(b => b.id);
        const sprints = await Promise.all(
            ids.reduce((promises, id) => {
                promises.push(get(token, JiraLinks.sprints(id)));
                return promises;
            }, [])
        );

        const sprintsNames = sprints
            .map(item => item.values.map(spt => `'${spt.name}'`))
            .reduce((flat, item) => flat.concat(item), [])
            .join(',');

        const { name } = await get(token, JiraLinks.username());
        const jql =  JiraLinks.issuesJQL(name, JiraLabels[name], sprintsNames);
        const response = await post(token, JiraLinks.issues(), {
            jql,
            fields: ['summary', 'project', 'issuekey'],
        });
        const issues = response.issues
            .map(item => {
                return {
                    project: item.fields.project.key,
                    task: item.key,
                };
            });
        return issues;
    } catch (e) {
        console.log(e);
        return [];
    }
}

module.exports = {
    getData,
};