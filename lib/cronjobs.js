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
    new CronJob('*/20 0-1,10-23 * * 1-5', function() {
        axios.get(`${process.env.APP_URL}/status`)
            .then(res => {
                console.log(res.data);
            })
            .catch(err => {
                console.error(err);
            });
    }, null, true, 'Europe/Kiev');
}

function sheduleNotifications(cb) {
    // At 17:00 on every day-of-week from Monday through Friday.
    const sheduler = new CronJob('0 17 * * 1-5', function() {
        console.log('notify');
        cb();
    }, null, true, 'Europe/Kiev');
    console.log(sheduler);
}

module.exports = {
    status,
    sheduleNotifications,
};
