const fetch = require('node-fetch');
const HBLogger = require(process.cwd() + '/utility/logger').logger;

const getAIRequestOption = (query, optionObj) => {
    const { endpoint, token, llmprovider, llmmodel, llmk } = optionObj;
    return {
        method: 'POST',
        url: endpoint,
        headers: {
            authorization: `Bearer ${token}`,
            "Content-Type": 'application/json'
        },
        data: {
            query,
            llm_provider: llmprovider,
            llm_model: llmmodel,
            k: llmk,
        },
    };
};

const getAIResponse = async (query, optionObj) => {
    try {
        const option = getAIRequestOption(query, optionObj);
        const response = await fetch(option.url, {
            method: option.method,
            headers: option.headers,
            body: JSON.stringify(option.data),
        });
        const data = await response.json();
        return data;
    } catch (error) {
        const { message, stack } = error;
        HBLogger.error(`Error in getEdenAIResponse: ${message} ${stack}`);
        return null;
    }
};


const getBeetuRequestOption = (queryObj, optionObj) => {
    const { endpoint, token } = optionObj;
    const { question, user_id } = queryObj
    return {
        method: 'POST',
        url: endpoint,
        headers: {
            "x-beetu-api-key": token,
            "Content-Type": 'application/json'
        },
        data: {
            question,
            user_id
        },
    };
};

const getBeetuResponse = async (query, optionObj) => {
    try {
        const option = getBeetuRequestOption(query, optionObj);
        const response = await fetch(option.url, {
            method: option.method,
            headers: option.headers,
            body: JSON.stringify(option.data),
        });
        const data = await response.json();
        return data;
    } catch (error) {
        const { message, stack } = error;
        HBLogger.error(`Error in getBeetuResponse: ${message} ${stack}`);
        return null;
    }
};

module.exports = { getAIResponse, getBeetuResponse };
