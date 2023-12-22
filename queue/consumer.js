const { Kafka } = require('kafkajs')
const HBLogger = require(process.cwd() + '/utility/logger').logger;
const { webhookDa } = require(process.cwd() + '/webhook/webhookda');

const configProd = {
    clientId: process.env.KAFKA_CONSUMER_CLIENT_ID,
    brokers: process.env.KAFKA_BROKER.split(',')
}

const configNonProd = {
    clientId: process.env.KAFKA_CONSUMER_CLIENT_ID,
    brokers: process.env.KAFKA_BROKER.split(','),
    ssl: process.env.KAFKA_SSL,
    sasl: {
        mechanism: process.env.KAFKA_SASL_MECHANISM,
        username: process.env.KAFKA_SASL_USERNAME,
        password: process.env.KAFKA_SASL_PASSWORD
    },
}

const config = process.env.NODE_ENV === 'production' ? configProd : configNonProd

const kafka = new Kafka(config);

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
        // eachBatchAutoResolve: true,
        // eachBatch: async ({
        //                       batch,
        //                       resolveOffset,
        //                       heartbeat
        //                   }) => {
        //                     const messages = [];
        //                     for (let message of batch.messages) {
        //                         if (message && message.value) {
        //                             messages.push(JSON.parse(message.value))
        //                         }
        //                         resolveOffset(message.offset)
        //                         await heartbeat()
        //                     }
        //
        //                     switch (batch.topic) {
        //                         case process.env.KAFKA_SAVE_CHAT_TOPIC:
        //                             await webhookDa.addChatDetailsInBulk(messages);
        //                             break;
        //                         case process.env.KAFKA_TEST_TOPIC:
        //                             HBLogger.info(`message received on TEST TOPIC`);
        //                             console.log(messages);
        //                             break;
        //                         default:
        //                             HBLogger.error(`unknown topic: `, topic)
        //                     }
        // },
    })
}

module.exports = {
    consumeFromQueue
}

