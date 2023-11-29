const { Pool } = require('pg');
const HBLogger = require(process.cwd() + '/utility/logger').logger
const poolManager = require("./poolmanager");

const dbPool = () => { }

// Create a connection pool
const pool = new Pool({
    user: process.env.DB_USER_NAME,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    max: 20
});

const sqlConfig = {
    name:"PG_HB",
    config:{
        user: process.env.DB_USER_NAME,
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        max: 20
    }
}

// Executes the given parameterized query.
dbPool.executeQuery = async (queryText, values) => {    
    let DBResponse;
    try {
        const pool = poolManager.get(sqlConfig);
        await pool.connect();

        // Execute a query using the client
        DBResponse = await pool.query(queryText, values); 
    } catch (err) {
        await poolManager.closeAll();
        HBLogger.error(`dbPool.executeQuery error: ${err.message}`);
    }
    return DBResponse;
}

// // Executes the given parameterized query.
// dbPool.executeQuery = async (queryText, values) => {
//     // Get a client from the connection pool
//     //const client = await pool.connect();
    
//     let DBResponse;
//     try {
//         // Execute a query using the client
//         DBResponse = await pool.query(queryText, values);
//         console.log(DBResponse.rows);
//     } catch (err) {
//         console.error(err);
//         HBLogger.error(`dbPool.executeQuery error: ${err.message}`);
//     } finally {
//         // Release the client back to the pool
//         //client.release();
//     }
//     return DBResponse;
// }

module.exports = dbPool
