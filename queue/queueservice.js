const { pushToQueue } = require(process.cwd() + '/queue/producer');

const queueService = {};

queueService.sendMessage = async (req, res, next) => {
    const { message } = req.body;
    await pushToQueue(process.env.KAFKA_TEST_TOPIC, message);
    return next();
}

module.exports = {
    queueService
}
