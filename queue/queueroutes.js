const { queueService }  = require('./queueservice');

let queueRoutes = [
    {
        type: 'post',
        path: '/queue/:messageId',
        controller: queueService.sendMessage
    },
];

module.exports = {
    queueRoutes,
};
