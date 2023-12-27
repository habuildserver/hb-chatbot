const Logger = require('../utility/logger').logger;
const dbHelper = require('../dataaccess/dbhelper');
const { SELECT_MEMBER_CHAT_DETAILS } = require('../dataaccess/query');

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


module.exports = {
  chatService,
};
