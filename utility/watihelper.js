const FormData = require('form-data');
const fetch = require('node-fetch');
const HBLogger = require(process.cwd() + '/utility/logger').logger;

const sendWhatsappMessage = async (
    name,
    mobilenumber,
    endpoint,
    token,
    responseText,
    text
) => {
    HBLogger.info(
        `Sending whatsapp message to ${name} having ${mobilenumber} with response: ${responseText} against: ${text} at ${endpoint}`
    );
    try {
        let form = new FormData();
        form.append('messageText', responseText);
        let watiResult = await fetch(
            `${endpoint}/api/v1/sendSessionMessage/${mobilenumber}`,
            {
                method: 'POST',
                body: form,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        watiResult = await watiResult.json();
        HBLogger.info(`sendWhatsappMessage watiResult: ${JSON.stringify(watiResult)}`);
    } catch (error) {
        const { message, stack } = error;
        HBLogger.error(`Error in sendWhatsappMessage: ${message} ${stack}`);
    }
};

const sendWhatsappButtonMessage = async (
    name,
    mobilenumber,
    endpoint,
    token,
    response,
    text
) => {
    HBLogger.info(
        `Sending whatsapp message to ${name} having ${mobilenumber} with response: ${response} against: ${text} at ${endpoint}`
    );
    try {
        let watiResult = await fetch(
            `${endpoint}/api/v1/sendInteractiveButtonsMessage?whatsappNumber=${mobilenumber}`,
            {
                method: 'POST',
                body: JSON.stringify(response),
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            }
        );
        watiResult = await watiResult.json();
        HBLogger.info(`sendWhatsappMessage watiResult: ${JSON.stringify(watiResult)}`);
    } catch (error) {
        const { message, stack } = error;
        HBLogger.error(`Error in sendWhatsappMessage: ${message} ${stack}`);
    }
};

module.exports = {
    sendWhatsappMessage,
    sendWhatsappButtonMessage
};
