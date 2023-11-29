const mysql = require('mysql2');
const HBLogger = require(process.cwd() + '/utility/logger').logger;

const connection = mysql.createConnection(
    process.env.HB_ATTENDANCE_DATABASE_URL
);
connection.connect();

exports.executeQuery = async (query, params = []) => {
    try {
        return new Promise((resolve, reject) => {
            connection.execute(query, params, function (err, results, fields) {
                if (err) {
                    reject(err); // reject the Promise with the error
                } else {
                    resolve({ results, fields }); // resolve the Promise with the results and fields
                }
            });
        });
    } catch (error) {
        HBLogger.error(`exports.executeQuery error ${error.message}`);
    }
};
