const webhookBusiness = require(process.cwd() + '/webhook/webhookbusiness')

let webHookRoutes = [
    {
        type: 'post',
        path: '/chat/:watiserverid?',
        controller: webhookBusiness.chatWebhook,
    },
]

module.exports = {
    webHookRoutes,
}
