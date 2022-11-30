const cron = require('node-cron');
const utils = require('../utils');
const {getPgm} = utils;

const getPgmIdSchedule = cron.schedule("0 * * * * *", async () => {
    const pgmMap = await getPgm();
    global.pgmMap = pgmMap;
});

exports.startSchedule = () => getPgmIdSchedule.start();