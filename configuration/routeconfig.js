const { webHookRoutes } = require(process.cwd() + '/webhook/webhookservice');
const { queueRoutes } = require(process.cwd() + '/queue/queueroutes');
const HBLogger = require(process.cwd() + '/utility/logger').logger;
const { requestWatch } = require(process.cwd() + '/utility/commonfunctions');
const { userRoutes } = require(process.cwd() + '/otherApis/userRoutes');

module.exports = (app) => {
    let routes = [...webHookRoutes, ...queueRoutes, ...userRoutes];

    routes.forEach((route) => {
        app[route.type](
            route.path,
            requestWatch(async (req, res, next) => {
                HBLogger.info(
                    `HBLogTrack: ${JSON.stringify({
                        servicename: 'habuild-member-classjoin',
                        logtype: 'request',
                        logdate: new Date(),
                        logdetails: {
                            headers: JSON.stringify(req.headers),
                            body: JSON.stringify(req.body),
                            param: JSON.stringify(req.params),
                            query: JSON.stringify(req.query),
                        },
                    })}`
                );
                //// Below code is to bypass the auth middleware.
                await route.controller(req, res, next);
            })
        );
    });
};
