const HBLogger = require(process.cwd() + '/utility/logger').logger;
const serviceConfig = require('../configuration/serviceconfig.json');
const {
    GET_INIT_PAYMENT_LOGS,
    UPDATE_PAYMENT_SCHEDULER_FAIL_CHECK_DONE,
    GET_NON_CHECKED_LATEST_FAILED_PAYMENTS,
} = require('../dataaccess/query');

const { redishandler } = require(process.cwd() + '/utility/redishandler');
const { commonFunctions } = require(process.cwd() + '/utility/commonfunctions');
const { memberDa } = require(process.cwd() + '/member/memberda');
const { ADD_REDIRECTION_SHORTLINK_LOGS } = require(process.cwd() +
    '/dataaccess/query');

const logAttendanceInDB = async () => {
    try {
        HBLogger.info(`logAttendanceInDB called In`);
        const getAttendance = await redishandler.LRANGE(
            'RedirectLogsArray',
            0,
            -1
        );
        if (getAttendance && getAttendance.length > 0) {
            HBLogger.info(
                `logAttendanceInDB got the attendance in redis for key RedirectLogsArray`
            );

            HBLogger.info(
                `logAttendanceInDB logged attendance in DB for length ${getAttendance.length}`
            );
            await redishandler.LTRIM(
                'RedirectLogsArray',
                getAttendance.length,
                -1
            );
            HBLogger.info(
                `logAttendanceInDB logged attendance removed in redis key RedirectLogsArray for length ${getAttendance.length}`
            );

            const objectsArray = getAttendance.map((objectString) =>
                JSON.parse(objectString)
            );
            await memberDa.processQueryWithFilters(
                ADD_REDIRECTION_SHORTLINK_LOGS,
                [JSON.stringify(objectsArray)]
            );
        }
    } catch (error) {
        const { message, stack } = error;
        HBLogger.error(
            `Error occured in logAttendanceInDB : ${message} ${stack}`
        );
        throw error;
    }
};

module.exports = { logAttendanceInDB };
