const cron = require('node-cron');
const { logAttendanceInDB } = require('../utility/schedulerhelper');
const HBLogger = require(process.cwd() + '/utility/logger').logger;

//run every 10 min
const logAttendance = cron.schedule(
    '*/10 * * * *',
    async () => {
        try {
            HBLogger.info(`logAttendance scheduler execution started`);
            await logAttendanceInDB();
            HBLogger.info(
                `logAttendance scheduler execution completed successfully`
            );
        } catch (error) {
            const { message, stack } = error;
            HBLogger.error(
                `Error occured in logAttendance scheduler  : ${message} ${stack}`
            );
        }
    },
    {
        scheduled: false,
    }
);

logAttendance.start();
