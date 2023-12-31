const moment = require('moment');
const fetch = require('node-fetch');
const HBLogger = require(process.cwd() + '/utility/logger').logger;
const { commonFunctions } = require(process.cwd() + '/utility/commonfunctions');
const { redishandler } = require(process.cwd() + '/utility/redishandler');
const serviceconfig = require(process.cwd() + '/configuration/serviceconfig');
const { getAIResponse, getBeetuResponse } = require(process.cwd() + '/utility/aiservice');
const { sendWhatsappMessage, sendWhatsappButtonMessage } = require(process.cwd() + '/utility/watihelper');
const { pushToQueue } = require(process.cwd() + '/queue/producer');
const { pushToRabbitQueueWithDelay } = require(process.cwd() + '/queue/rabbitmq/producer');
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
            type,
            data,
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
        
        if (type === 'image' || type === 'video') {
            HBLogger.info(`webhookbusiness.chatWebhook call in with type ${type}`)

            const mediaChatDetails = {
                name: senderName,
                chatrequesttimestamp: new Date(created),
                whatsappmessageid: whatsappMessageId,
                url: data,
                waid: waId,
                eventtype: eventType,
                watiserverid,
                type
            };

            await pushToQueue(
                process.env.KAFKA_SAVE_MEDIA_CHAT_TOPIC,
                mediaChatDetails
            );

        } 

        let currentDate = new Date();
        // Subtract 5 seconds (5 * 1000 milliseconds) from the current date
        let newDate = new Date(currentDate.getTime() - 5000);
        let webhookRequestDate = new Date(created);
        if (webhookRequestDate > newDate) {

            //// Call me logic via tata tele
            let callMeValid = await callMeCheck(text, waId);
            if (callMeValid) {
                HBLogger.info(`webhookbusiness.chatWebhook callMeValid ${callMeValid} for waId: ${waId}`)
                webhookBusiness.postTataTeleClickToCall(waId, true);
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
            let staticResponseType = undefined;
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
                    staticResponseType = genericKeyword.type
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
            if (answer === '' || ["I'm sorry, I don't know."].includes(answer) || answer === 'BEETU_STOP') {
                HBLogger.info(`Not sending the response back as AI's answer is: ${answer}`);
            } else {
                if (staticResponse && staticResponseType === 'button') {
                    await sendWhatsappButtonMessage(
                        senderName,
                        waId,
                        watiaccount.endpoint,
                        watiaccount.token,
                        answer,
                        text
                    );
                } else {
                    await sendWhatsappMessage(
                        senderName,
                        waId,
                        watiaccount.endpoint,
                        watiaccount.token,
                        answer,
                        text
                    );
                }
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
    HBLogger.info(`callMeCheck call in for: ${text} and waId: ${waId}`);
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
    return callMe;
}

webhookBusiness.postTataTeleClickToCall = async (waId, agentCheck) => {

    HBLogger.info(`postTataTeleClickToCall for waId: ${waId}`);

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

    if (agentCheck) {
        try {
            HBLogger.info(`postTataTeleClickToCall call in for waId: ${input.destination_number} and isAgentFree: ${isAgentFree}`);
            if(isAgentFree) {
                fetch('https://api-smartflo.tatateleservices.com/v1/click_to_call', {
                    method: 'POST',
                    body: JSON.stringify(input),
                    headers: {
                        'Content-Type': 'application/json',
                        "Authorization": `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOjMxNzA4OCwiaXNzIjoiaHR0cHM6XC9cL2Nsb3VkcGhvbmUudGF0YXRlbGVzZXJ2aWNlcy5jb21cL3Rva2VuXC9nZW5lcmF0ZSIsImlhdCI6MTY4NzYwMDYxNywiZXhwIjoxOTg3NjAwNjE3LCJuYmYiOjE2ODc2MDA2MTcsImp0aSI6IkFpclNObWY5d1RIbndRT2IifQ.dQMiZV147llcXOq-dchSoUh5Vhh5wxz9I5rYkqgIQqc`
                    }
                });
            } else {
                HBLogger.info(`postTataTeleClickToCall call scheduled after 5 mins for waId: ${input.destination_number} and isAgentFree: ${isAgentFree}`);
                //// schedule Call back after 5 minutes with message queue.
                const queueData = {
                    waId
                }
                await pushToRabbitQueueWithDelay(process.env.RABBITMQ_TATATELE_DELAY_EXCHANGE, queueData, process.env.RABBITMQ_CHATBOT_TATATELE_DELAY);
            }

        } catch (error) {
            HBLogger.error(`postTataTeleClickToCall: Error in posting data: ${error.message}`);
        }


    } else {
        try {
            HBLogger.info(`postTataTeleClickToCall call without agent check for waId: ${input.destination_number} and isAgentFree: ${isAgentFree}`);

            fetch('https://api-smartflo.tatateleservices.com/v1/click_to_call', {
                method: 'POST',
                body: JSON.stringify(input),
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOjMxNzA4OCwiaXNzIjoiaHR0cHM6XC9cL2Nsb3VkcGhvbmUudGF0YXRlbGVzZXJ2aWNlcy5jb21cL3Rva2VuXC9nZW5lcmF0ZSIsImlhdCI6MTY4NzYwMDYxNywiZXhwIjoxOTg3NjAwNjE3LCJuYmYiOjE2ODc2MDA2MTcsImp0aSI6IkFpclNObWY5d1RIbndRT2IifQ.dQMiZV147llcXOq-dchSoUh5Vhh5wxz9I5rYkqgIQqc`
                }
            });

        } catch (error) {
            HBLogger.error(`postTataTeleClickToCall: Error in posting data: ${error.message}`);
        }
    }
}

let getAvailableAgents = async (agentNo) => {
    HBLogger.info(`getAvailableAgents call in agentNo: ${agentNo}`);
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
        const numberOfMatches = liveCallsResult.reduce((count, obj) => {
            if (obj.did == `+${agentNo}`) {
              return count + 1;
            }
            return count;
          }, 0);
          
        HBLogger.info(`getAvailableAgents call numberOfMatches for agentNo: ${agentNo} is ${numberOfMatches}`);
        if (numberOfMatches && numberOfMatches < 9) {
            HBLogger.info(`getAvailableAgents call numberOfMatches for agentNo: ${agentNo} is < 9`);
            availableAgent = true;
        }
        else
        {
            HBLogger.info(`getAvailableAgents call numberOfMatches for agentNo: ${agentNo} is >= 9 so availableAgent is busy`);
            availableAgent = false; 
        }            
    }
    return availableAgent;
}

module.exports = {
    webhookBusiness,
};
