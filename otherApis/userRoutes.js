const {userController} = require(process.cwd() + '/otherApis/userController.js');

let userRoutes = [
  {
    type: 'get',
    path: '/searchUser/:mobileNumber',
    controller: userController.searchChatHistoryByMobile,
  },
  {
    type: 'get',
    path: '/getMemberMediaChat',
    controller: userController.getMemberMediaChat,
  },
  {
    type: 'post',
    path: '/updateMediaChatResolvedStatus',
    controller: userController.updateMediaChatResolvedStatus,
  },
];

module.exports = { userRoutes, }; 
