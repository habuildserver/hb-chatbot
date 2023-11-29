const moment = require('moment')
const fetch = require('node-fetch')
const HBLogger = require(process.cwd() + '/utility/logger').logger
const { commonFunctions } = require(process.cwd() + '/utility/commonfunctions')
const { memberDa } = require(process.cwd() + '/member/memberda')
const { GET_SHORT_LINK_DETAILS_ROUTE_BY_ROUTE, GET_YT_LINK, ADD_REDIRECTION_SHORTLINK_LOGS, GET_DS_YT_LINK, GET_WEEK_REDIRECT_LOGS,UPDATE_DEVICE_IN_REDIRECT_LOGS } = require(process.cwd() + '/dataaccess/query')
const { redishandler } = require(process.cwd() + '/utility/redishandler')
const useragent = require('express-useragent');
let memberBusiness = () => ({})

memberBusiness.redirectToYogaClass = async (req, res, next) => {
    let appLink = "";
    try {
        if (req && req.params && req.params.shortroute) {
            req.locals = {}; 

            const shortRoute = req.params.shortroute.toLowerCase();
            HBLogger.info(`memberBusiness.redirectToYogaClass call in for shortRoute: ${shortRoute}`);
            const userAgent = req.headers['user-agent']

            req.locals.userAgent = {
                ip: req.headers["x-forwarded-for"] ? req.headers["x-forwarded-for"] : "",
                userAgent: userAgent ? JSON.stringify(userAgent) : ''
            };

            let memberCacheResult = await redishandler.get(shortRoute);

            if (memberCacheResult) {
                HBLogger.info(`memberBusiness.redirectToYogaClass call in cache for shortRoute: ${shortRoute}`);
                memberCacheResult = JSON.parse(memberCacheResult);
                if (memberCacheResult.is_youtube) {
                    const yTCacheValue = await redishandler.get("youtube_link");
                    if (yTCacheValue) {
                        memberCacheResult.ytlink = yTCacheValue;
                        HBLogger.info(`memberBusiness.redirectToYogaClass from cache Opened video with YouTube app for link: ${memberCacheResult.ytlink} for shortroute: ${shortRoute}`);
                    }
                    else {
                        const ytLinkResult = await memberDa.processQueryWithFilters(
                            GET_YT_LINK, []
                        )
                        memberCacheResult.ytlink = ytLinkResult && ytLinkResult.rowCount > 0 ? ytLinkResult.rows[0].ytlink : "";
                        await redishandler.set("youtube_link", memberCacheResult.ytlink, parseInt(process.env.REDIRECT_SHORT_ROUTE_TTL));
                        HBLogger.info(`memberBusiness.redirectToYogaClass get ytlink from database link: ${memberCacheResult.ytlink} for shortroute: ${shortRoute}`);
                    }

                    appLink = await getYTAppLink(memberCacheResult, userAgent, shortRoute);
                }
                else {
                    //// Redirect to zoom url.
                    HBLogger.info(`memberBusiness.redirectToYogaClass call in cache for shortRoute: ${shortRoute} and redirected to zoom.`);
                    appLink = memberCacheResult.long_url;
                }

                if (memberCacheResult.type == "MEET") {
                    // set shortRoute cookies
                    res.cookie("shortRoute", shortRoute, {
                        domain: process.env.HABUILD_DOMAIN_NAME,
                        httponly: process.env.COOKIE_HTTP_ONLY == "true" ? true : false,
                        secure: process.env.COOKIE_SECURE == "true" ? true : false,
                        sameSite: process.env.COOKIE_SAME_SITE == "true" ? undefined : "None",
                        maxAge: 3600 * 1000 * 24 * 365 * parseInt(process.env.COOKIE_DURATION),
                    });
                    addShortLinkRedirectionLog(memberCacheResult, shortRoute, req);
                }
                else {
                    const cookieShortRoute = req.cookies ? req.cookies["shortRoute"] : "";
                    let cookieMemberCacheResult = await redishandler.get(cookieShortRoute);
                    if (cookieMemberCacheResult) {
                        HBLogger.info(`memberBusiness.redirectToYogaClass log redirection in redis cache for cookie shortRoute: ${cookieShortRoute} in custom shortlink clicked by member`);
                        cookieMemberCacheResult = JSON.parse(cookieMemberCacheResult);
                        addShortLinkRedirectionLog(cookieMemberCacheResult, cookieShortRoute, req);
                        HBLogger.info(`memberBusiness.redirectToYogaClass log redirection in redis cache completed for cookie shortRoute: ${cookieShortRoute} in custom shortlink clicked by member`);
                    }
                }
            }
            else {
                HBLogger.info(`memberBusiness.redirectToYogaClass call in database for shortRoute: ${shortRoute}`);
                const memberResult = await memberDa.processQueryWithFilters(
                    GET_SHORT_LINK_DETAILS_ROUTE_BY_ROUTE, [shortRoute, process.env.YOGA_CLASS_PROGRAM_ID]
                )

                if (memberResult && memberResult.rowCount > 0) {
                    const member = memberResult.rows[0];

                    await redishandler.set("youtube_link", member.ytlink, parseInt(process.env.REDIRECT_SHORT_ROUTE_TTL));

                    if (member.memberstatus && (member.memberstatus.toLowerCase() == "active"
                        || member.memberstatus.toLowerCase() == "paused")) {

                        await redishandler.set(
                            shortRoute,
                            JSON.stringify({
                                id: member.id,
                                shortlinkid: member.shortlinkid,
                                base_url: member.base_url,
                                short_url: `${member.base_url}${shortRoute}`,
                                long_url: member.long_url,
                                type: member.type,
                                is_tracking_attendance: false,
                                is_youtube: (member.current_channel.toLowerCase() == "zoom" ||
                                    member.current_channel.toLowerCase() == "custommeettype") ? false : true,
                                programid: member.programid,
                                isytapp: member.isytapp
                            }),
                            parseInt(process.env.REDIRECT_SHORT_ROUTE_TTL)
                        )

                        if (member.current_channel.toLowerCase() == "zoom") {
                            //// Redirect to zoom url.
                            appLink = member.long_url;
                        } else {
                            //// Redirect to youtube url.
                            appLink = await getYTAppLink(member, userAgent, shortRoute);
                            HBLogger.info(`memberBusiness.redirectToYogaClass Opened video with YouTube app for link: ${appLink} for shortroute: ${shortRoute}`);
                        }
                    }
                    else {
                        //// Redirect to payement page. In this case long_url contains the membershipplan url.
                        appLink = member.long_url;
                    }
                    if (member.type == "MEET") {
                        // set shortRoute cookies
                        res.cookie("shortRoute", shortRoute, {
                            domain: process.env.HABUILD_DOMAIN_NAME,
                            httponly: process.env.COOKIE_HTTP_ONLY == "true" ? true : false,
                            secure: process.env.COOKIE_SECURE == "true" ? true : false,
                            sameSite: process.env.COOKIE_SAME_SITE == "true" ? undefined : "None",
                            maxAge: 3600 * 1000 * 24 * 365 * parseInt(process.env.COOKIE_DURATION),
                        });
                        addShortLinkRedirectionLog(member, shortRoute, req);
                    }
                }
                else {
                    res.locals.data = commonFunctions.createResponse({}, { message: `short url ${shortRoute} does not exist.` });
                    next();
                }
            }
        }
        else {
            res.locals.data = commonFunctions.createResponse({}, { message: 'Not a valid short url.' });
            next();
        }

    } catch (err) {
        HBLogger.error(`memberBusiness.redirectToYogaClass error: ${err.message} ${err.stack}`);
        res.locals.data = commonFunctions.createResponse({}, { message: 'Something went wrong' });
        next();
    }
    if (appLink != "") {
        // Send a dummy response to trigger the redirect
        res.redirect(appLink);
    }
}

memberBusiness.redirectToTest = async (req, res, next) => {
    HBLogger.info(`memberBusiness.redirectToTest headers: ${JSON.stringify(req.headers)} body: ${JSON.stringify(req.body)}`);
    res.locals.data = commonFunctions.createResponse({ message: 'success' }, {});
    next();
}

const getYTAppLink = async (member, userAgent, shortRoute, className = "yoga") => {
    const isMobile = userAgent ? /Mobile/.test(userAgent) : false;
    let appLink = "";
    if (className == "yoga") {
        appLink = member.ytlink;
    }
    else if (className == "dancestretch") {
        appLink = member.dsytlink;
    }

    let videoId = "";

    if (isMobile && member.isytapp && (userAgent && (userAgent.indexOf('iPhone') >= 0 || userAgent.indexOf('iPad') >= 0
        || userAgent.indexOf('iPod') >= 0))) {

        // let splitAppLink = appLink.split("?v=")
        // if (splitAppLink && splitAppLink.length > 1) {
        //     videoId = splitAppLink[1];
        // }
        // const safariVersion = userAgent.match(/Version\/(\d+)/);
        // if (safariVersion && safariVersion.length > 1 && parseInt(safariVersion[1]) < 15) {
        //     appLink = member.ytlink
        // }
        // else
        //     appLink = `youtube://watch?v=${videoId}`;

        appLink = appLink;
        HBLogger.info(`getYTAppLink for shortRoute: ${shortRoute} userAgent:${userAgent} and  mobile device for iPhone or ipad with redirecturl: ${appLink}`);

    } else if (isMobile && member.isytapp) {
        let splitAppLink = appLink.split("?v=")
        if (splitAppLink && splitAppLink.length > 1) {
            videoId = splitAppLink[1];
        }
        appLink = `vnd.youtube:${videoId}`;
        HBLogger.info(`getYTAppLink for shortRoute: ${shortRoute} userAgent:${userAgent} and mobile device found with redirecturl: ${appLink}`);
    } else {
        HBLogger.info(`getYTAppLink for shortRoute: ${shortRoute} userAgent:${userAgent} and not from mobile device and redirecturl: ${appLink}`);
    }
    return appLink;
}

const addShortLinkRedirectionLog = async (member, shortRoute, req) => {
    HBLogger.info(`addShortLinkRedirectionLog call in for redis insert attendance shortRoute: ${shortRoute}`);
    const myObject = {
        id: member.id,
        shortlinkid: member.shortlinkid,
        short_url: `${member.base_url}${shortRoute}`,
        long_url: member.long_url,
        created_at: new Date(moment.utc()),
        source: "LINK_CLICKED",
        programid: member.programid,
        useragent: req.locals.userAgent
    };
    // redishandler.RPUSH("RedirectLogsArray", JSON.stringify(myObject)); 

    try {
        memberDa.insertRedirectionLogsInPlanetScale(myObject);
    } catch (error) {
        console.log(`addShortLinkRedirectionLog PlanetScale Attendance db error: ${error.message}`)
    }
}

memberBusiness.redirectTestYogaMeeting = async (req, res, next) => {
    HBLogger.info(`memberBusiness.redirectYogaMeeting call in`);
    const os = require('os');
    const videoId = 'yInaei50iWg'; // replace with the ID of the YouTube video you want to open
    let appLink = `https://www.youtube.com/watch?v=${videoId}`;
    try {
        if (os.platform() === 'win32' || os.platform() === 'darwin' || os.platform() === 'linux'
            || os.platform() === 'android') {
            appLink = `youtube://watch?v=${videoId}`;
            HBLogger.info(`memberBusiness.redirectYogaMeeting ${os.platform()}`);
        }
        console.log(`Opened video with ID ${videoId} in the YouTube app for link: ${appLink}`);
    } catch (error) {
        console.error(`memberBusiness.redirectYogaMeeting Error opening video with ID ${videoId} : ${error.message}`);
    }
    HBLogger.info(`memberBusiness.redirectYogaMeeting call completed`);
    res.redirect(appLink);
}

memberBusiness.resetRedisKey = async (req, res, next) => {
    HBLogger.info(`memberBusiness.resetRedisKey call in`);
    try {
        if (req && req.params && req.params.key) {
            await redishandler.DEL(req.params.key.toLowerCase());
            res.locals.data = commonFunctions.createResponse({ message: `short url ${req.params.key} reset successfyll.` }, {});
        } else {
            res.locals.data = commonFunctions.createResponse({}, { message: `please enter key` });
        }
    } catch (error) {
        HBLogger.error(`memberBusiness.resetRedisKey error: ${error.message}`);
    }
    HBLogger.info(`memberBusiness.resetRedisKey call completed`);
    next();
}

memberBusiness.deleteMultipleKeys = async (req, res, next) => {
    HBLogger.info(`memberBusiness.deleteMultipleKeys call in`);
    try {
        if (req && req.body && req.body.keys && req.body.keys.length > 0) {
            const lowerCaseArray = req.body.keys.map(str => str.toLowerCase());

            await redishandler.DEL(lowerCaseArray);
            res.locals.data = commonFunctions.createResponse({ message: `short urls reset successfyll.` }, {});
        } else {
            res.locals.data = commonFunctions.createResponse({}, { message: `please enter key` });
        }
    } catch (error) {
        HBLogger.error(`memberBusiness.deleteMultipleKeys error: ${error.message}`);
    }
    HBLogger.info(`memberBusiness.deleteMultipleKeys call completed`);
    next();
}

memberBusiness.redirectToDanceStretchClass = async (req, res, next) => {
    let appLink = "";
    try {
        if (req && req.params && req.params.shortroute) {
            req.locals = {};

            let shortRoute = req.params.shortroute.toLowerCase();

            if (!shortRoute) {
                shortRoute = req.cookies ? req.cookies["shortRoute"] : "";
                HBLogger.info(`memberBusiness.redirectToDanceStretchClass call in for shortRoute: ${shortRoute} got from cookies`);
            }
            else
                HBLogger.info(`memberBusiness.redirectToDanceStretchClass call in for shortRoute: ${shortRoute}`);

            const userAgent = req.headers['user-agent']

            req.locals.userAgent = {
                ip: req.headers["x-forwarded-for"] ? req.headers["x-forwarded-for"] : "",
                userAgent: userAgent ? JSON.stringify(userAgent) : ''
            };

            let memberCacheResult = await redishandler.get(shortRoute);

            if (memberCacheResult) {
                HBLogger.info(`memberBusiness.redirectToDanceStretchClass call in cache for shortRoute: ${shortRoute}`);
                memberCacheResult = JSON.parse(memberCacheResult);

                const yTCacheValue = await redishandler.get("dsyoutube_link");
                if (yTCacheValue) {
                    memberCacheResult.dsytlink = yTCacheValue;
                    HBLogger.info(`memberBusiness.redirectToDanceStretchClass from cache Opened video with YouTube app for link: ${memberCacheResult.dsytlink} for shortroute: ${shortRoute}`);
                }
                else {
                    const ytLinkResult = await memberDa.processQueryWithFilters(
                        GET_DS_YT_LINK, []
                    )

                    memberCacheResult.dsytlink = ytLinkResult && ytLinkResult.rowCount > 0 ? ytLinkResult.rows[0].dsytlink : "";

                    await redishandler.set("dsyoutube_link", memberCacheResult.dsytlink, parseInt(process.env.REDIRECT_SHORT_ROUTE_TTL));
                    HBLogger.info(`memberBusiness.redirectToDanceStretchClass get dsytlink from database dsytlink: ${memberCacheResult.dsytlink} for shortroute: ${shortRoute}`);
                }

                appLink = await getYTAppLink(memberCacheResult, userAgent, shortRoute, "dancestretch");

                if (memberCacheResult.type == "MEET") {
                    // set shortRoute cookies
                    res.cookie("shortRoute", shortRoute, {
                        domain: process.env.HABUILD_DOMAIN_NAME,
                        httponly: process.env.COOKIE_HTTP_ONLY == "true" ? true : false,
                        secure: process.env.COOKIE_SECURE == "true" ? true : false,
                        sameSite: process.env.COOKIE_SAME_SITE == "true" ? undefined : "None",
                        maxAge: 3600 * 1000 * 24 * 365 * parseInt(process.env.COOKIE_DURATION),
                    });
                    addShortLinkRedirectionLog(memberCacheResult, shortRoute, req);
                }
                else {
                    const cookieShortRoute = req.cookies ? req.cookies["shortRoute"] : "";
                    let cookieMemberCacheResult = await redishandler.get(cookieShortRoute);
                    if (cookieMemberCacheResult) {
                        HBLogger.info(`memberBusiness.redirectToDanceStretchClass log redirection in redis cache for cookie shortRoute: ${cookieShortRoute} in custom shortlink clicked by member`);
                        cookieMemberCacheResult = JSON.parse(cookieMemberCacheResult);
                        addShortLinkRedirectionLog(cookieMemberCacheResult, cookieShortRoute, req);
                        HBLogger.info(`memberBusiness.redirectToDanceStretchClass log redirection in redis cache completed for cookie shortRoute: ${cookieShortRoute} in custom shortlink clicked by member`);
                    }
                }
            }
            else {
                HBLogger.info(`memberBusiness.redirectToDanceStretchClass call in database for shortRoute: ${shortRoute}`);
                const memberResult = await memberDa.processQueryWithFilters(
                    GET_SHORT_LINK_DETAILS_ROUTE_BY_ROUTE, [shortRoute, process.env.YOGA_CLASS_PROGRAM_ID]
                )

                if (memberResult && memberResult.rowCount > 0) {
                    const member = memberResult.rows[0];
 
                    await redishandler.set("dsyoutube_link", member.dsytlink, parseInt(process.env.REDIRECT_SHORT_ROUTE_TTL));

                    if (member.memberstatus && (member.memberstatus.toLowerCase() == "active"
                        || member.memberstatus.toLowerCase() == "paused")) {

                        await redishandler.set(
                            shortRoute,
                            JSON.stringify({
                                id: member.id,
                                shortlinkid: member.shortlinkid,
                                base_url: member.base_url,
                                short_url: `${member.base_url}${shortRoute}`,
                                long_url: member.long_url,
                                type: member.type,
                                is_tracking_attendance: false,
                                is_youtube: (member.current_channel.toLowerCase() == "zoom" ||
                                    member.current_channel.toLowerCase() == "custommeettype") ? false : true,
                                programid: member.programid,
                                isytapp: member.isytapp
                            }),
                            parseInt(process.env.REDIRECT_SHORT_ROUTE_TTL)
                        )

                        //// Redirect to youtube url.
                        appLink = await getYTAppLink(member, userAgent, shortRoute, "dancestretch");
                        HBLogger.info(`memberBusiness.redirectToDanceStretchClass Opened video with YouTube app for link: ${appLink} for shortroute: ${shortRoute}`);
                    }
                    else {
                        //// Redirect to payement page. In this case long_url contains the membershipplan url.
                        appLink = member.long_url;
                    }
                    if (member.type == "MEET") {
                        // set shortRoute cookies
                        res.cookie("shortRoute", shortRoute, {
                            domain: process.env.HABUILD_DOMAIN_NAME,
                            httponly: process.env.COOKIE_HTTP_ONLY == "true" ? true : false,
                            secure: process.env.COOKIE_SECURE == "true" ? true : false,
                            sameSite: process.env.COOKIE_SAME_SITE == "true" ? undefined : "None",
                            maxAge: 3600 * 1000 * 24 * 365 * parseInt(process.env.COOKIE_DURATION),
                        });
                        addShortLinkRedirectionLog(member, shortRoute, req);
                    }
                }
                else {
                    res.locals.data = commonFunctions.createResponse({}, { message: `short url ${shortRoute} does not exist.` });
                    next();
                }
            }
        }
        else {
            res.locals.data = commonFunctions.createResponse({}, { message: 'Not a valid short url.' });
            next();
        }

    } catch (err) {
        HBLogger.error(`memberBusiness.redirectToDanceStretchClass error: ${err.message} ${err.stack}`);
        res.locals.data = commonFunctions.createResponse({}, { message: 'Something went wrong' });
        next();
    }
    if (appLink != "") {
        res.redirect(appLink);
    }
}

memberBusiness.calculateDevice = async (req, res, next) => {
    const redirectResult = await memberDa.processQueryWithFilters(
        GET_WEEK_REDIRECT_LOGS, []
    )
    if (redirectResult) {
        const jsonArray = [];
        for (let index = 0; index < redirectResult.rows.length; index++) {
            try {
                const element = redirectResult.rows[index];
                if (element && element.useragent) {
                    const ss = JSON.parse(element.useragent);
                    const userAgent = useragent.parse(ss.userAgent);

                    let deviceType;

                    if (userAgent.isDesktop) {
                        deviceType = 'Desktop';
                    } else if (userAgent.isiPhone) {
                        deviceType = 'iPhone';
                    } else if (userAgent.isiPad) {
                        deviceType = 'iPad';
                    } else if (userAgent.isiPod) {
                        deviceType = 'iPod';
                    } else if (userAgent.isAndroid) {
                        deviceType = 'Android';
                    } else if (userAgent.isTablet) {
                        deviceType = 'Tablet';
                    } else if (userAgent.isiPhoneNative) {
                        deviceType = 'iPhoneNative';
                    } else if (userAgent.isAndroidNative) {
                        deviceType = 'AndroidNative';
                    } else if (userAgent.isBlackberry) {
                        deviceType = 'Blackberry';
                    } else if (userAgent.isSmartTV) {
                        deviceType = 'SmartTV';
                    } else {
                        deviceType = 'Other';
                    }
                    jsonArray.push(
                        { id: element.id, device: deviceType }
                    )
                    
                }
            } catch (err) {
                HBLogger.error(`memberBusiness.calculateDevice error: ${err.message} ${err.stack}`);
            }
        }

        await memberDa.processQueryWithFilters(
            UPDATE_DEVICE_IN_REDIRECT_LOGS,
            [JSON.stringify(jsonArray)]
        );
    }
    res.locals.data = commonFunctions.createResponse({ message: 'well' }, {});
    next();
}

module.exports = {
    memberBusiness,
}
