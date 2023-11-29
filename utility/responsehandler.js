const HBLogger = require(process.cwd() + '/utility/logger').logger
const serviceconfig = require(process.cwd() + '/configuration/serviceconfig')

module.exports = () => {
    return (req, res) => {
        let response = res.locals.data
        HBLogger.info(
            `HBLogTrack: ${JSON.stringify({
                servicename: 'HBLogTrack',
                // logrequestid: req.headers[serviceconfig.constants.requestID],
                logtype: 'response',
                logdate: new Date(),
                logdetails: {
                    output: response ? JSON.stringify(response) : '',
                },
            })}`
        )

        if (response && response.error && Object.keys(response.error).length) {
            if (response.error.message == 'Forbidden')
                res.status(403).send(response)
            if (
                response.error.message ==
                serviceconfig.error.REQUEST_SAVE_ERROR ||
                response.error.message == serviceconfig.error.COMMON_API_ERROR
            )
                res.status(500).send(response)
            else res.status(400).send(response)
        } else res.status(200).send(response)
    }
}
