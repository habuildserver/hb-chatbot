const { Kafka } = require('kafkajs')
const HBLogger = require(process.cwd() + '/utility/logger').logger;
const { webhookDa } = require(process.cwd() + '/webhook/webhookda');

const kafka = new Kafka({
    clientId: process.env.KAFKA_CONSUMER_CLIENT_ID,
    brokers: [process.env.KAFKA_BROKER],
})

const consumeFromQueue = async (consumerGroup, topic) => {
    const consumer = kafka.consumer({ groupId: consumerGroup })

    await consumer.connect()
    await consumer.subscribe({ topic: topic })

    HBLogger.info(`kafka consumer connected to ${consumerGroup} and topic ${topic}`)

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            switch (topic) {
                case process.env.KAFKA_SAVE_CHAT_TOPIC:
                    await webhookDa.addChatDetails(JSON.parse(message.value));
                    break;
                case process.env.KAFKA_TEST_TOPIC:
                    HBLogger.info(`message received on TEST TOPIC`);
                    console.log(JSON.parse(message.value));
                    break;
                default:
                    HBLogger.error(`unknown topic: `, topic)
            }
        },
    })
}

module.exports = {
    consumeFromQueue
}

