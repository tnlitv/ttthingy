const mongoose = require('mongoose');
const calendar = require('./calendar.js');
const Jira = new require('./jira');
const Projects = require('../providers/Projects');

const status = function (req, res) {
    return res.json({
        server: 'ok',
        db: mongoose.connection.readyState,
    });
};

const workflow = async function (email) {
    try {
        if (!email) {
            throw new Error('email required');
        }
        const [cData, jData] = await Promise.all([
            calendar.getEvents(email),
            Jira.getData(email),
        ]);
        let out = [cData];
        const reducedJD = jData.reduce((groups, item) => {
            const proj = Projects(item.project);
            groups[proj] = groups[proj] || [];
            groups[proj].push(item.task);
            return groups;
        }, {});
        const JDKeys = Object.keys(reducedJD);
        const mappedJD = JDKeys.map((key) => {
            const out = {};
            out[key] = (+process.env.MAX_HOURS - +cData['Meeting h']) / JDKeys.length;
            out.desc = reducedJD[key].join(',');
            return out;
        });
        Array.prototype.push.apply(out, mappedJD);
        return out;
    } catch (e) {
        console.error(e);
        return [];
    }
};

module.exports = {
    status,
    workflow,
};