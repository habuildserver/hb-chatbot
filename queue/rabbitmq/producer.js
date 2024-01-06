var amqp = require('amqplib');

const bindingKey = process.env.RABBITMQ_BINDING_KEY

const channels = {};

const initializeProducer = async (exchange, queue) => {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(queue, {
        durable: false
    });
    await channel.assertExchange(exchange, 'x-delayed-message')
    channel.bindQueue(queue, exchange, bindingKey);
    channels[exchange] = channel;
}

const pushToRabbitQueueWithDelay = async (exchange, message, delay) => {
    console.log(`Sending message ${JSON.stringify(message)} to ${exchange} queue with delay ${delay}`)
    console.log(Buffer.from(JSON.stringify(message)));
    channels[exchange].publish(exchange, bindingKey, Buffer.from(JSON.stringify(message)), {
        headers: {
            'x-delay': delay
        }
    });
}

module.exports = {
    initializeProducer,
    pushToRabbitQueueWithDelay
}
