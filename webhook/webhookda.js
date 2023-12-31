const { INSERT_MEDIA_CHAT_DETAILS } = require("../dataaccess/query");

const HBLogger = require(process.cwd() + '/utility/logger').logger;
const dbHelper = require(process.cwd() + '/dataaccess/dbhelper');
const { INSERT_CHAT_DETAIL,
    INSERT_CHAT_DETAILS_IN_BULK } = require(process.cwd() + '/dataaccess/query');

const processQueryWithFilters = async (query = '', filters = []) => {
    const response = await dbHelper.executeNonQuery(query, filters);
    return response;
};

const webhookDa = () => {};

webhookDa.addChatDetails = async (chatDetail) => {
    HBLogger.info(`in addChatDetails call start ${JSON.stringify(chatDetail)}`,);
    const chatDetailId =  chatDetail.id ? chatDetail.id : 'NA';
    let queryResult = await processQueryWithFilters(
        INSERT_CHAT_DETAIL,
        [chatDetailId, chatDetail?.name, chatDetail?.chatrequesttimestamp,
            chatDetail?.whatsappmessageid, chatDetail?.waticonversationid, chatDetail?.question, chatDetail?.answer,
            chatDetail?.waid, chatDetail?.eventtype, chatDetail?.watiserverid, chatDetail?.responder]
    );
    HBLogger.info(
        `managementDa.addChatDetails call end queryResult ${JSON.stringify(queryResult?.rows)} `
    )
    return queryResult;
}

webhookDa.addChatDetailsInBulk = async (bulkChatDetail) => {
    HBLogger.info(`in addChatDetailsInBulk call start`);
    const bulkInsertQuery = INSERT_CHAT_DETAILS_IN_BULK(bulkChatDetail);
    HBLogger.info(`bulk insert query ${bulkInsertQuery}`);
    let queryResult = await processQueryWithFilters(
        bulkInsertQuery
    );
    HBLogger.info(
        `managementDa.addChatDetailsInBulk call end queryResult ${JSON.stringify(queryResult?.rows)} `
    )
    return queryResult;
}

webhookDa.addMediaChatDetails = async (mediaChatDetail) => {
    HBLogger.info(
        `in addMediaChatDetails call start ${JSON.stringify(mediaChatDetail)}`
    );
    let queryResult = await processQueryWithFilters(INSERT_MEDIA_CHAT_DETAILS, [
        mediaChatDetail?.name,
        mediaChatDetail?.chatrequesttimestamp,
        mediaChatDetail?.whatsappmessageid,
        mediaChatDetail?.url,
        mediaChatDetail?.waid,
        mediaChatDetail?.eventtype,
        mediaChatDetail?.watiserverid,
        mediaChatDetail?.type
    ]);
    HBLogger.info(
        `managementDa.addMediaChatDetails call end queryResult ${JSON.stringify(
            queryResult?.rows
        )} `
    );
    return queryResult;
}

module.exports = { webhookDa };
