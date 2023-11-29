const moment = require('moment')
const fetch = require('node-fetch')
const HBLogger = require(process.cwd() + '/utility/logger').logger
const { commonFunctions } = require(process.cwd() + '/utility/commonfunctions')
const { redishandler } = require(process.cwd() + '/utility/redishandler')

let webhookBusiness = () => ({})

webhookBusiness.chatWebhook = async (req, res) => {
    try {
        // 1. Get the query from the request
        const watiserverid = req.query.watiserverid
        const { waId, text, senderName } = req.body

        // 2. Get AI providers from redis

        

    } catch (error) {
        const { message, stack } = error
        HBLogger.error(
            `Error in webhookBusiness.chatWebhook: ${message} ${stack}`
        )
    }
}

module.exports = {
    webhookBusiness,
}
