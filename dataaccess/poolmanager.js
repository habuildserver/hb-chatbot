const { Pool } = require('pg');
const pools = new Map();
const HBLogger = require(process.cwd() + '/utility/logger').logger;

const set = ({ name, config }) => {
    if (!name || !config) {
        HBLogger.error('Pool-Manager: Missing configuration details');
        throw new Error(`Missing configuration details`);
    }

    const pool = new Pool(config);
    // const close = pool.end(pool);
    // pool.end = (...args) => {
    //     pools.delete(name);
    //     return close(...args);
    // };
    pools.set(name, pool);
};

const get = (options) => {
    if (!pools.has(options.name)) {
        HBLogger.info(`Creating new pool for ${options.name}`);
        set(options);
    }
    return pools.get(options.name);
};

const close = async (name) => {
    const pool = pools.get(name);
    if (!pool) {
        HBLogger.error(`Pool-Manager: Pool ${name} does not exist`);
        throw Error(`Pool ${name} does not exist`);
    }
    await pool.end();
};

const closeAll = async () => {
    const promises = Array.from(pools.values()).map((pool) => pool.end());
    await Promise.all(promises);
};

module.exports = {
    get,
    close,
    closeAll,
};
