const { commonFunctions } = require(process.cwd() + '/utility/commonfunctions');
const HBLogger = require(process.cwd() + '/utility/logger').logger;

module.exports = () => {
    return (err, req, res, next) => {
        HBLogger.error(
            `HBLogTrack: ${JSON.stringify({
                servicename: 'habuild-member-management',
                // logrequestid: req.headers["request-id"],
                logtype: 'error',
                logdate: new Date(),
                logdetails: {
                    errormessage: err.message,
                    stacktrace: err.stack,
                },
            })}`
        );
        let resultStatus = 'Something went wrong.';
        return res
            .status(500)
            .send(
                commonFunctions.createResponse({}, { message: resultStatus })
            );
    };
};
