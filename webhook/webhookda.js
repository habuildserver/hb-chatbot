const HBLogger = require(process.cwd() + '/utility/logger').logger;
const dbHelper = require(process.cwd() + '/dataaccess/dbhelper');
const dbPoolHelper = require(process.cwd() + '/dataaccess/dbhelperpool');
const {} = require(process.cwd() + '/dataaccess/query');

const { executeQuery } = require(process.cwd() +
    '/dataaccess/dbhelperplanetscale');

const webhookDa = () => {};

module.exports = { webhookDa };
