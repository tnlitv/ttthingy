const CronJob = require('cron').CronJob;
const axios = require('axios');

function status() {
    /*
     * Should allow heroku not sleep. Lul.
     * At every 20th minute past every hour from 0 through 1
     * and every hour from 10 through 23
     * on every day-of-week from Monday through Friday
     * this will just notify heroku
    */
    new CronJob('*19,39,59 10-22 * * 1-5', function() {
        console.log('heroku hook');
        axios.get(`${process.env.APP_URL}/status`)
            .then(res => {
                console.log(res.data);
            })
            .catch(err => {
                console.error(err);
            });
    }, null, true, 'Europe/Kiev');
}

function createCustomCronJob(time, cb) {
    return new CronJob(time, cb, null, true, 'Europe/Kiev');
}

module.exports = {
    status,
    createCustomCronJob,
};
