var amqp = require('amqplib');
const { webhookBusiness } = require(process.cwd() + '/webhook/webhookbusiness');

const consumeFromRabbitQueue = async (queue) => {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(queue, {
        durable: false
    });
    channel.consume(queue, async (msg) => {
        console.log(`Received message on ${queue} with ${msg.content}`);
        const { waId } = JSON.parse(msg.content);
        console.log(waId);
        await webhookBusiness.postTataTeleClickToCall(waId, false);
    }, {
        noAck: true
    });
}

module.exports = {
    consumeFromRabbitQueue
}
