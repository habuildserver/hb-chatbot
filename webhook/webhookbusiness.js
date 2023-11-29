const moment = require('moment');
const fetch = require('node-fetch');
const HBLogger = require(process.cwd() + '/utility/logger').logger;
const commonFunctions = require(process.cwd() + '/utility/commonfunctions');
const { redishandler } = require(process.cwd() + '/utility/redishandler');
const serviceconfig = require(process.cwd() + '/configuration/serviceconfig');
const { getAIResponse } = require(process.cwd() + '/utility/aiservice');
const { sendWhatsappMessage } = require(process.cwd() + '/utility/watihelper');

let webhookBusiness = () => ({});

webhookBusiness.chatWebhook = async (req, res, next) => {
    try {
        // 1. Get the query from the request
        const { watiserverid } = req.params;
        const { waId, text, senderName } = req.body;

        // 2. Get AI providers from redis
        let apiProvidersList = await redishandler.get(
            serviceconfig.cachekeys.MASTERAIPROVIDER
        );

        apiProvidersList = apiProvidersList ? JSON.parse(apiProvidersList) : [];

        const provider = apiProvidersList.reduce((acc, cur) => {
            return acc.requestcnt < cur.requestcnt ? cur : acc;
        });

        // 3. Call AI provider
        const response = await getAIResponse(text, provider);

        // 4. Send the response to the user
        if (response) {
            let watiAccountDetails = await redishandler.get(
                serviceconfig.cachekeys.WATISERVER
            );
            watiAccountDetails = watiAccountDetails ? JSON.parse(watiAccountDetails) : [];
            const watiaccount = watiAccountDetails.find(
                (row) => row.watiserverid == watiserverid
            );
            sendWhatsappMessage(
                senderName,
                waId,
                watiaccount.endpoint,
                watiaccount.token,
                response.result
            );
        }

        //5 . Save the conversation in the Redis cache
    } catch (error) {
        const { message, stack } = error;
        HBLogger.error(
            `Error in webhookBusiness.chatWebhook: ${message} ${stack}`
        );
    }
    res.locals.data = commonFunctions.createResponse({
        status: 200,
        message: 'Success',
        data: {},
    });
    return next();
};

module.exports = {
    webhookBusiness,
};
