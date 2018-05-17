const axios = require('axios');
require('dotenv').config();

axios.get(`${process.env.APP_URL}/status`)
    .then(res => {
        console.log(res.data);
    })
    .catch(res => {
        console.error(res.toString());
    });