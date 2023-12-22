const { Kafka, CompressionTypes } = require('kafkajs')
const HBLogger = require(process.cwd() + '/utility/logger').logger;

const kafka = new Kafka({
    clientId: process.env.KAFKA_PRODUCER_CLIENT_ID,
    brokers: process.env.KAFKA_BROKER.split(','),
    // ssl: process.env.KAFKA_SSL,
    // sasl: {
    //     mechanism: process.env.KAFKA_SASL_MECHANISM,
    //     username: process.env.KAFKA_SASL_USERNAME,
    //     password: process.env.KAFKA_SASL_PASSWORD
    // },
})

const pushToQueue = async (topic, message) => {

    const producer = kafka.producer()
    await producer.connect()
    await producer.send({
        topic: topic,
        compression: CompressionTypes.GZIP,
        messages: [
            {value: JSON.stringify(message)}
        ],
    })

    HBLogger.info(`sent new message ${JSON.stringify(message)} to ${topic}`)

    await producer.disconnect()
}

module.exports = {
    pushToQueue
}


