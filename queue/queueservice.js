const { pushToQueue } = require(process.cwd() + '/queue/producer');
const { pushToRabbitQueueWithDelay } = require(process.cwd() + '/queue/rabbitmq/producer');

const queueService = {};

queueService.sendMessage = async (req, res, next) => {
    const { message } = req.body;
    await pushToQueue(process.env.KAFKA_TEST_TOPIC, message);
    return next();
}

queueService.sendMessageWithDelay = async (req, res, next) => {
    const { message, delay } = req.body;
    await pushToRabbitQueueWithDelay(process.env.RABBITMQ_TEST_QUEUE, message, delay);
    return next();
}

module.exports = {
    queueService
}
