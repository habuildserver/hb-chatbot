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

        switch (queue) {
            case process.env.RABBITMQ_CHATBOT_TATATELE_QUEUE:
                const { waId } = JSON.parse(msg.content);
                await webhookBusiness.postTataTeleClickToCall(waId, false);
                break;
            case process.env.RABBITMQ_TEST_QUEUE:
                console.log(`message received on TEST QUEUE`);
                console.log(JSON.parse(msg.content));
                break;
            default:
                console.log(`unknown queue: `, queue)
        }
    }, {
        noAck: true
    });
}

module.exports = {
    consumeFromRabbitQueue
}
