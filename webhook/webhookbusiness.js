const moment = require('moment');
const fetch = require('node-fetch');
const HBLogger = require(process.cwd() + '/utility/logger').logger;
const { commonFunctions } = require(process.cwd() + '/utility/commonfunctions');
const { redishandler } = require(process.cwd() + '/utility/redishandler');
const serviceconfig = require(process.cwd() + '/configuration/serviceconfig');
const { getAIResponse, getBeetuResponse } = require(process.cwd() + '/utility/aiservice');
const { sendWhatsappMessage } = require(process.cwd() + '/utility/watihelper');
const { pushToQueue } = require(process.cwd() + '/queue/producer');
const emoji = require('node-emoji');

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
            text: originalText,
            waId,
            eventType,
        } = req.body;
        const text = emoji.strip(originalText, {
            preserveSpaces: false
        });
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

            //// Call me logic via tata tele
            let callMeValid = await callMeCheck(text, waId);
            if (callMeValid) {
                res.locals.data = commonFunctions.createResponse({
                    status: 200,
                    message: 'Success',
                    data: {},
                });
                return next();
            }

            let restrictedKeywordList = await redishandler.LRANGE(
                serviceconfig.cachekeys.RESTRICTED_KEYWORDS,
                0,
                -1
            );

            restrictedKeywordList.map((restrictedKeyword) => {
                if ((text.length <= restrictedKeyword.length + 3) && (text.toLowerCase().includes(restrictedKeyword.toLowerCase()))) {
                    throw new Error('Restricted keyword');
                }
            });

            // Send auto responses for generic keywords

            let answer = '';
            let staticResponse = undefined;
            let responder = null;

            let genericKeywordList = await redishandler.LRANGE(
                serviceconfig.cachekeys.GENERIC_KEYWORDS,
                0,
                -1
            );

            genericKeywordList.map((genericKeywordString) => {
                const genericKeyword = JSON.parse(genericKeywordString);
                if ((text.length < genericKeyword.lengthToCheck) && (text.toLowerCase().includes(genericKeyword.question.toLowerCase()))) {
                    staticResponse = genericKeyword.answer
                }
            });

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

            if (staticResponse) {
                HBLogger.info(`static response found: ${staticResponse}`);
                answer = staticResponse;
                responder = 'SERVICE';
            } else {
                // 2. Get AI providers from redis

                if (watiaccount.responder === 'beetu') {

                    let beetuProvider = await redishandler.get(
                        serviceconfig.cachekeys.BEETUSERVER
                    );

                    const beetuQueryObj = {
                        question: text,
                        user_id: waId
                    }

                    const response = await getBeetuResponse(beetuQueryObj, JSON.parse(beetuProvider));

                    answer = response.answer || '';
                    responder = 'BEETU';
                    HBLogger.info(`response from Beetu: ${answer}`);

                } else {
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
                    const response = await getAIResponse(text, JSON.parse(provider));

                    answer = response.result || '';
                    responder = 'EDEN';
                    HBLogger.info(`response from Eden AI: ${answer}`);
                }
            }

            // 4. Send the response to the user
            if (answer != '' && !["I'm sorry, I don't know."].includes(answer)) {
                await sendWhatsappMessage(
                    senderName,
                    waId,
                    watiaccount.endpoint,
                    watiaccount.token,
                    answer,
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
                answer,
                waid: waId,
                eventtype: eventType,
                watiserverid,
                responder
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

let callMeCheck = async (text, waId) => {
    HBLogger.info(`callMeCheck call in for waId: ${waId}`);
    let callMe = false;
    let callMeKeywordList = await redishandler.LRANGE(
        serviceconfig.cachekeys.CALLMEKEYWORDS,
        0,
        -1
    );

    callMeKeywordList.map((callmeKeyword) => {
        if (text.toLowerCase().includes(callmeKeyword.toLowerCase())) {
            callMe = true;
        }
    });

    if (callMe) {
        HBLogger.info(`callMeCheck for waId: ${waId} call me text: ${text} as input`);
        let agentNumber = await redishandler.get(
            serviceconfig.cachekeys.TATATELEAGENTNUMBER
        );

        const isAgentFree = await getAvailableAgents(agentNumber);
        HBLogger.info(`callMeCheck for waId: ${waId} and isAgentFree: ${isAgentFree}`);
        let input = {
            "agent_number": agentNumber,
            "destination_number": waId,
            "caller_id": agentNumber,
            "custom_identifier": "CLICK_TO_CALL_BY_HB_Job",
            "call_timeout": 300
        };
        postTataTeleClickToCall(input, isAgentFree);
    }
    return callMe;
}

let postTataTeleClickToCall = async (data, isAgentFree) => {
    try {
        HBLogger.info(`postTataTeleClickToCall call in for waId: ${data.destination_number} and isAgentFree: ${isAgentFree}`);
        if(isAgentFree){
            fetch('https://api-smartflo.tatateleservices.com/v1/click_to_call', {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOjMxNzA4OCwiaXNzIjoiaHR0cHM6XC9cL2Nsb3VkcGhvbmUudGF0YXRlbGVzZXJ2aWNlcy5jb21cL3Rva2VuXC9nZW5lcmF0ZSIsImlhdCI6MTY4NzYwMDYxNywiZXhwIjoxOTg3NjAwNjE3LCJuYmYiOjE2ODc2MDA2MTcsImp0aSI6IkFpclNObWY5d1RIbndRT2IifQ.dQMiZV147llcXOq-dchSoUh5Vhh5wxz9I5rYkqgIQqc`
                }
            });
        }
        else{
            //// schedule Call back after 5 minutes with message queue.
        } 
    } catch (error) {
        HBLogger.error(`postTataTeleClickToCall: Error in posting data: ${error.message}`);
    }
}

let getAvailableAgents = async (agentNo) => {
    let availableAgent = true;
    let liveCallsResult = await fetch(`https://api-smartflo.tatateleservices.com/v1/live_calls`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOjMxNzA4OCwiaXNzIjoiaHR0cHM6XC9cL2Nsb3VkcGhvbmUudGF0YXRlbGVzZXJ2aWNlcy5jb21cL3Rva2VuXC9nZW5lcmF0ZSIsImlhdCI6MTY4NzYwMDYxNywiZXhwIjoxOTg3NjAwNjE3LCJuYmYiOjE2ODc2MDA2MTcsImp0aSI6IkFpclNObWY5d1RIbndRT2IifQ.dQMiZV147llcXOq-dchSoUh5Vhh5wxz9I5rYkqgIQqc`,
        }
    });
    liveCallsResult = await liveCallsResult.json();

    if (liveCallsResult && liveCallsResult.length > 0) {
        const destinationKeys = liveCallsResult.map(obj => obj.did);
        availableAgent = !destinationKeys.includes(`+${agentNo}`);
    }
    return availableAgent;
}

module.exports = {
    webhookBusiness,
};
