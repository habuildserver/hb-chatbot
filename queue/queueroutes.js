const { queueService }  = require('./queueservice');

let queueRoutes = [
    {
        type: 'post',
        path: '/queue/:messageId',
        controller: queueService.sendMessage
    },
    {
        type: 'post',
        path: '/delayed-message',
        controller: queueService.sendMessageWithDelay
    },
];

module.exports = {
    queueRoutes,
};
