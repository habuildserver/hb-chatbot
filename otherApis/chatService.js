const Logger = require('../utility/logger').logger;
const dbHelper = require('../dataaccess/dbhelper');
const { SELECT_MEMBER_CHAT_DETAILS, SELECT_MEMBER_MEDIA_CHAT_DETAILS, UPDATE_RESOLVED_STATUS } = require('../dataaccess/query');

const chatService = {};

chatService.retrieveMemberChats = async (mobileNumber) => {
  Logger.info(`Starting member chat retrieval`);
  try {
    const searchResult = await dbHelper.executeNonQuery(SELECT_MEMBER_CHAT_DETAILS, [mobileNumber]);
    Logger.info(`Member chat retrieval successful`);
    return searchResult; 
  } catch (error) {
    Logger.error(`Error retrieving member chats: ${error}`);
    throw error;
  }
};

chatService.getMemberMediaChat = async () => {
  Logger.info(`Starting ~chatService ~getMemberMediaChat`);
  try {
    const chatResult = await dbHelper.executeNonQuery(
        SELECT_MEMBER_MEDIA_CHAT_DETAILS,
        []
    );
    console.log('chatResult :: ', chatResult.rows);
    Logger.info(`Member chat retrieval successful`);
    return chatResult;
  } catch (error) {
    Logger.error(`Error retrieving member media chats: ${error}`);
    throw error;
  }
};

chatService.updateMediaChatResolvedStatus = async (
  memberMediaChatId,
  resolvedStatus
) => {
  Logger.info(`Starting ~chatService ~updateMediaChatResolvedStatus`);
  try {
    const queryResult = await dbHelper.executeNonQuery(
      UPDATE_RESOLVED_STATUS,
      [memberMediaChatId, resolvedStatus]
    );
    Logger.info(`Member chat resolved status update successful`);
    return queryResult;
  } catch (error) {
    Logger.error(`Error retrieving member media chats: ${error}`);
    throw error;
  }
};


module.exports = {
  chatService,
};
