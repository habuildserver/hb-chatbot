const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const http = require('http');
const HBLogger = require(process.cwd() + '/utility/logger').logger;
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });
require('dotenv').config();
const cors = require('cors');
const useragent = require('express-useragent');
const cookieParser = require('cookie-parser');
const { consumeFromQueue } = require(process.cwd() + '/queue/consumer');
const { consumeFromRabbitQueue } = require(process.cwd() + '/queue/rabbitmq/consumer')
const { initializeProducer } = require(process.cwd() + '/queue/rabbitmq/producer')

// app.use(useragent.express());

app.set('userAgent', (req, userAgent) => {
    const {
        headers: { 'user-agent': ua },
    } = req;
    return ua;
});

const corsOptionsDelegate = (req, callback) => {
    HBLogger.info('Requestcount:');
    let corsOptions;
    let byPassCors = process.env.BYPASS_CORS_FOR_API.indexOf(req.path) !== -1;
    if (byPassCors) {
        // Enable CORS for this request
        console.log(`by pass cors for path: ${req.path}`);
        corsOptions = { origin: true };
        callback(null, corsOptions);
    } else {
        let origin = req.header('Origin') ? req.header('Origin') : '';
        if (!origin)
            origin = req.header('host') ? 'https://' + req.header('host') : '';
        if (!origin)
            origin = req.header('referer') ? req.header('referer') : '';

        let isDomainAllowed =
            process.env.WHITE_LIST_ORIGINS.indexOf(origin) !== -1;
        console.log(`origin name: ${origin}`);
        console.log(`headers: ${JSON.stringify(req.headers)}`);
        if (isDomainAllowed) {
            // Enable CORS for this request
            console.log(`Allowed by CORS for: ${origin}`);
            corsOptions = { origin: true, credentials: true };
            callback(null, corsOptions);
        } else {
            // Disable CORS for this request
            corsOptions = { origin: false, credentials: true };
            console.log(`Not allowed by CORS for: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    }
};
app.use(cors(corsOptionsDelegate));

// app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

const errorHandler = require(process.cwd() + '/utility/errorhandler');
const responsehandler = require(process.cwd() + '/utility/responsehandler');

require(process.cwd() + '/configuration/routeconfig')(app);

// register default middlewares
app.use(responsehandler());
app.use(errorHandler());

const server = http.createServer(app);

consumeFromQueue(process.env.KAFKA_CONSUMER_GROUP, process.env.KAFKA_SAVE_CHAT_TOPIC);
consumeFromQueue(process.env.KAFKA_TEST_CONSUMER_GROUP, process.env.KAFKA_TEST_TOPIC);
consumeFromQueue(
    process.env.KAFKA_MEDIA_CHAT_CONSUMER_GROUP,
    process.env.KAFKA_SAVE_MEDIA_CHAT_TOPIC
);

initializeProducer(process.env.RABBITMQ_TATATELE_DELAY_EXCHANGE, process.env.RABBITMQ_CHATBOT_TATATELE_QUEUE);
initializeProducer(process.env.RABBITMQ_TEST_EXCHANGE, process.env.RABBITMQ_TEST_QUEUE);
consumeFromRabbitQueue(process.env.RABBITMQ_CHATBOT_TATATELE_QUEUE)
consumeFromRabbitQueue(process.env.RABBITMQ_TEST_QUEUE)

server.listen(parseInt(process.env.HABUILD_CHATBOT_PORT), function () {
    console.log(
        `hbchatbot Server Started on port ${process.env.HABUILD_CHATBOT_PORT}`
    );
});

module.exports = server;
