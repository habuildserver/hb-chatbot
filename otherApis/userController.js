const { chatService } = require(process.cwd() + '/otherApis/chatService.js');

let userController = {};

userController.searchChatHistoryByMobile = async (req, res, next) => {
  try {
    const { mobileNumber } = req.params;
    const searchResult = await chatService.retrieveMemberChats(mobileNumber);

    // Check if searchResult and searchResult.rows are defined
    if (searchResult && searchResult.rows) {
      if (searchResult.rows.length > 0) {
        res.json({
          status: 'success',
          message: 'Member chat history found',
          data: searchResult.rows,
        });
      } else {
        res.status(404).json({
          status: 'not found',
          message: 'No chat history found for the provided mobile number',
        });
      }
    } else {
      // Handle the case where searchResult or searchResult.rows is undefined
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve member chat history',
        error: 'Unexpected format in database response',
      });
    }
  } catch (error) {
    console.error("userController.js file error hai ye:", error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve member chat history',
      error: error.message,
    });
  }
  return next();
};

module.exports = {
    userController,
};