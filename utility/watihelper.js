const fetch = require('node-fetch');
const HBLogger = require(process.cwd() + '/utility/logger').logger;

const sendWhatsappMessage = async (
    name,
    mobilenumber,
    endpoint,
    token,
    responseText
) => {
    HBLogger.info(
        `Sending whatsapp message to ${name} having ${mobilenumber} with response: ${responseText}`
    );
    try {
        fetch(
            `${endpoint}/api/v1/sendSessionMessage/${mobilenumber}?messageText=${responseText}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            }
        );
    } catch (error) {
        const { message, stack } = error;
        HBLogger.error(`Error in sendWhatsappMessage: ${message} ${stack}`);
    }
};

module.exports = {
    sendWhatsappMessage,
};
