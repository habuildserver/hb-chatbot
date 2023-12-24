const {userController} = require(process.cwd() + '/otherApis/userController.js');

let userRoutes = [
  {
    type: 'get',
    path: '/searchUser/:mobileNumber',
    controller: userController.searchChatHistoryByMobile,
  },
];

module.exports = { userRoutes, }; 
