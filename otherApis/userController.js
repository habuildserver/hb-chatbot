const { chatService } = require(process.cwd() + '/otherApis/chatService.js');

let userController = {};

userController.searchChatHistoryByMobile = async (req, res, next) => {
  try {
    const { mobileNumber } = req.params;
    const updateMobileNumber = `%${mobileNumber}%`;
    const searchResult = await chatService.retrieveMemberChats(updateMobileNumber);
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

userController.getMemberMediaChat = async (req, res, next) => {
  try {
    const mediaChatResult = await chatService.getMemberMediaChat();
    console.log('mediaChatResult :: ', mediaChatResult.rows);
    if (mediaChatResult && mediaChatResult.rows) {
      if (mediaChatResult.rows.length > 0) {
        res.json({
          status: 'success',
          message: 'Member media chat history found',
          data: mediaChatResult.rows,
        });
      } else {
        res.status(404).json({
          status: 'not found',
          message: 'No chat history found',
        });
      }
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve member media chat',
        error: 'Unexpected format in database response',
      });
    }
  } catch (error) {
    console.error('userController.js getMemberMediaChat ERROR', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve member media chat',
      error: error.message,
    });
  }
  return next();
};

userController.updateMediaChatResolvedStatus = async (req, res, next) => {
  try {
      const { memberMediaChatId, resolvedStatus } = req.body
        const queryResult = await chatService.updateMediaChatResolvedStatus(
          memberMediaChatId,
          resolvedStatus
        );
          console.log('query result :', queryResult)
        if (queryResult && queryResult.rows) {
          if (queryResult.rowCount > 0) {
              res.json({
                  status: 'success',
                  message:
                      'Member media chat resolved status updated successfully',
                  data: `${queryResult.rowCount} row(s) updated`,
              });
          } else {
              res.status(404).json({
                  status: 'not found',
                  message: 'No chat history found for this member',
              });
          }
        } else {
            res.status(500).json({
                status: 'error',
                message: 'Failed to update member media chat resolved status',
                error: 'Unexpected format in database response',
            });
        }
    } catch (error) {
        console.error('userController.js getMemberMediaChat ERROR', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update member media chat resolved status',
            error: error.message,
        });
    }
    return next();
};

module.exports = {
    userController,
};