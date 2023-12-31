const { Pool } = require('pg');
const db = () => {};

// Executes the given parameterized query.
db.executeNonQuery = async (queryText, values) => {
    const options = {
        user: process.env.DB_USER_NAME,
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    }
    const pool = new Pool(options);
    const response = await pool.query(queryText, values);
    await pool.end();
    return response;
};

module.exports = db;
