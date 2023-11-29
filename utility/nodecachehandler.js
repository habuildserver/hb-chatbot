const NodeCache = require("node-cache");
const myCache = new NodeCache();
let nodecachehandler = () => ({})

nodecachehandler.set = (key, value, ttl) => {
    const success = myCache.set(key, value, ttl);
    return success;
};

nodecachehandler.get = (key) => {
    const value = myCache.get(key);
    if (value) {
        return value;
    }
    else return "";
};

nodecachehandler.delKey = (key) => {
    const value = myCache.del(key);
    return value;
};

nodecachehandler.flushAll = (key) => {
    const value = myCache.flushAll();
    return value;
};
nodecachehandler.set("RedirectLogsArray", []);
module.exports = {
    nodecachehandler,
}
