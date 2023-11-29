const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
const serviceconfig = require(process.cwd() + '/configuration/serviceconfig');

const myFormat = printf((info) => {
    return `${new Date(info.timestamp)} [${info.label}] ${info.level}: ${
        info.message
    }`;
});

const configlevels = {
    error: 0,
    warn: 1,
    info: 2,
    verbose: 3,
    debug: 4,
    silly: 5,
};

const logger = createLogger({
    levels: configlevels,
    format: combine(label({ label: 'HBCHATBOT' }), timestamp(), myFormat),
    transports: [
        new transports.Console(),
        new transports.File({
            filename: serviceconfig.logfile.NAME,
            maxsize: Number(serviceconfig.logfile.SIZE), // 10mb
        }),
    ],
});

module.exports.logger = logger;
