const HBLogger = require(process.cwd() + '/utility/logger').logger;
const dbHelper = require(process.cwd() + '/dataaccess/dbhelper');
const { INSERT_CHAT_DETAIL } = require(process.cwd() + '/dataaccess/query');

const processQueryWithFilters = async (query = '', filters = []) => {
    const response = await dbHelper.executeNonQuery(query, filters);
    return response;
};

const webhookDa = () => {};

webhookDa.addChatDetails = async (chatDetail) => {
    HBLogger.info(`in addChatDetails call start`);
    let queryResult = await processQueryWithFilters(
        INSERT_CHAT_DETAIL,
        [chatDetail?.id, chatDetail?.name, chatDetail?.chatrequesttimestamp,
            chatDetail?.whatsappmessageid, chatDetail?.waticonversationid, chatDetail?.question, chatDetail?.answer,
            chatDetail?.waid, chatDetail?.eventtype, chatDetail?.watiserverid]
    );
    HBLogger.info(
        `managementDa.addChatDetails call end queryResult ${JSON.stringify(queryResult?.rows)} `
    )
    return queryResult;
}

module.exports = { webhookDa };
