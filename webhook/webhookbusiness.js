const moment = require('moment');
const fetch = require('node-fetch');
const HBLogger = require(process.cwd() + '/utility/logger').logger;
const { commonFunctions } = require(process.cwd() + '/utility/commonfunctions');
const { redishandler } = require(process.cwd() + '/utility/redishandler');
const serviceconfig = require(process.cwd() + '/configuration/serviceconfig');
const { getAIResponse } = require(process.cwd() + '/utility/aiservice');
const { sendWhatsappMessage } = require(process.cwd() + '/utility/watihelper');
const { pushToQueue } = require(process.cwd() + '/queue/producer');

let webhookBusiness = () => ({});

webhookBusiness.chatWebhook = async (req, res, next) => {
    try {
        // 1. Get the query from the request
        const { watiserverid } = req.params;
        const {
            id,
            senderName,
            created,
            whatsappMessageId,
            conversationId,
            text,
            waId,
            eventType,
        } = req.body;
        HBLogger.info(
            `webhookBusiness.chatWebhook call in with input: ${JSON.stringify(
                req.body
            )}`
        );

        let currentDate = new Date();
        // Subtract 5 seconds (5 * 1000 milliseconds) from the current date
        let newDate = new Date(currentDate.getTime() - 5000);
        let webhookRequestDate = new Date(created);
        if (webhookRequestDate > newDate) {
            let restrictedKeywordList = await redishandler.LRANGE(
                serviceconfig.cachekeys.RESTRICTED_KEYWORDS,
                0,
                -1
            );

            restrictedKeywordList.map((restrictedKeyword) => {
                if (text.includes(restrictedKeyword)) {
                    throw new Error('Restricted keyword');
                }
            });

            // 2. Get AI providers from redis
            let apiProvidersList = await redishandler.LRANGE(
                serviceconfig.cachekeys.MASTERAIPROVIDER,
                0,
                -1
            );

            apiProvidersList = apiProvidersList ? apiProvidersList : [];

            const provider = apiProvidersList.reduce((acc, cur) => {
                return JSON.parse(acc).requestcnt < JSON.parse(cur).requestcnt
                    ? JSON.parse(cur)
                    : JSON.parse(acc);
            });

            // 3. Call AI provider
            const response = await getAIResponse(text, provider);

            const answer = response.result || '';

            // 4. Send the response to the user
            if (response && !["I'm sorry, I don't know."].includes(answer)) {
                let watiAccountDetails = await redishandler.LRANGE(
                    serviceconfig.cachekeys.WATISERVER,
                    0,
                    -1
                );
                watiAccountDetails = watiAccountDetails
                    ? watiAccountDetails
                    : [];
                let watiaccount = watiAccountDetails.find(
                    (row) => JSON.parse(row).watiserverid == watiserverid
                );
                watiaccount = watiaccount ? JSON.parse(watiaccount) : {};
                await sendWhatsappMessage(
                    senderName,
                    waId,
                    watiaccount.endpoint,
                    watiaccount.token,
                    response.result,
                    text
                );
            }

            //5 . Save the conversation in the Redis cache

            const chatDetails = {
                id,
                name: senderName,
                chatrequesttimestamp: new Date(created),
                whatsappmessageid: whatsappMessageId,
                waticonversationid: conversationId,
                question: text,
                answer: response.result,
                waid: waId,
                eventtype: eventType,
                watiserverid,
            };

            await pushToQueue(process.env.KAFKA_SAVE_CHAT_TOPIC, chatDetails);
        } else {
            HBLogger.info(
                `webhookBusiness.chatWebhook old webhook triggers call for waId: ${waId}`
            );
        }
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
