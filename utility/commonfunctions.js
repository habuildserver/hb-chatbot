//// On error goes to error middleware.
const requestWatch = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

const commonFunctions = {};

commonFunctions.createResponse = (success = {}, error = {}) => {
    let result = {};
    result.success = success;
    result.error = error;
    return result;
};

commonFunctions.get_env = async (key) => {
    if (process.env.NODE_ENV == 'production') {
        return null;
    }
};
 
module.exports = {
    requestWatch,
    commonFunctions,
};
