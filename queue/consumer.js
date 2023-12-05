const { Kafka } = require('kafkajs')
const HBLogger = require(process.cwd() + '/utility/logger').logger;
const { webhookDa } = require(process.cwd() + '/webhook/webhookda');

const kafka = new Kafka({
    clientId: process.env.KAFKA_CONSUMER_CLIENT_ID,
    brokers: process.env.KAFKA_BROKER.split(','),
})

const consumeFromQueue = async (consumerGroup, topic) => {
    const consumer = kafka.consumer({ groupId: consumerGroup })

    await consumer.connect()
    await consumer.subscribe({ topic: topic })

    HBLogger.info(`kafka consumer connected to ${consumerGroup} and topic ${topic}`)

    await consumer.run({
        eachBatchAutoResolve: true,
        eachBatch: async ({
                              batch,
                              resolveOffset,
                              heartbeat
                          }) => {
                            const messages = [];
                            for (let message of batch.messages) {
                                if (message && message.value) {
                                    messages.push(JSON.parse(message.value))
                                }
                                resolveOffset(message.offset)
                                await heartbeat()
                            }

                            switch (batch.topic) {
                                case process.env.KAFKA_SAVE_CHAT_TOPIC:
                                    await webhookDa.addChatDetailsInBulk(messages);
                                    break;
                                case process.env.KAFKA_TEST_TOPIC:
                                    HBLogger.info(`message received on TEST TOPIC`);
                                    console.log(messages);
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

