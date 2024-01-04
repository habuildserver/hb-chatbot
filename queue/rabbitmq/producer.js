var amqp = require('amqplib');

const bindingKey = process.env.RABBITMQ_BINDING_KEY

const pushToRabbitQueueWithDelayTest = async (queue, message, delay) => {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(queue, {
        durable: false
    });
    await channel.assertExchange(process.env.RABBITMQ_TEST_EXCHANGE, 'x-delayed-message')
    channel.bindQueue(queue, process.env.RABBITMQ_TEST_EXCHANGE, bindingKey);

    console.log(`Sending message ${JSON.stringify(message)} to ${queue} queue with delay ${delay}`)
    console.log(Buffer.from(JSON.stringify(message)));
    channel.publish(process.env.RABBITMQ_TEST_EXCHANGE, bindingKey, Buffer.from(JSON.stringify(message)), {
        headers: {
            'x-delay': delay
        }
    });
}


const pushToRabbitQueueWithDelay = async (queue, message, delay) => {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(queue, {
        durable: false
    });
    await channel.assertExchange(process.env.RABBITMQ_TATATELE_DELAY_EXCHANGE, 'x-delayed-message')
    channel.bindQueue(queue, process.env.RABBITMQ_TATATELE_DELAY_EXCHANGE, bindingKey);

    console.log(`Sending message ${JSON.stringify(message)} to ${queue} queue with delay ${delay}`)
    console.log(Buffer.from(JSON.stringify(message)));
    channel.publish(process.env.RABBITMQ_TATATELE_DELAY_EXCHANGE, bindingKey, Buffer.from(JSON.stringify(message)), {
        headers: {
            'x-delay': delay
        }
    });
}

module.exports = {
    pushToRabbitQueueWithDelay,
    pushToRabbitQueueWithDelayTest
}
