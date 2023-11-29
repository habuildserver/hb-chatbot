
const HBLogger = require(process.cwd() + '/utility/logger').logger
const { commonFunctions } = require(process.cwd() + '/utility/commonfunctions')
const { memberDa } = require(process.cwd() + '/member/memberda');
const {
    GET_SHORT_ROUTE_BY_ROUTE,

} = require(process.cwd() + '/dataaccess/query');

const getShortLinkDetails = async (memberData) => {
    HBLogger.info(`getShortLinkDetails called in`);
    let result = {};
    try {
        let short_route = await generateShortrouteByMemberId(memberData);
        return {
            base_url: process.env.BASE_URL,
            long_url: await commonFunctions.registerUserOnYouTube(short_route),
            short_route: short_route,
            short_meeting_link: `${process.env.BASE_URL}${short_route}`,
        };
    } catch (err) {
        const { message, stack } = err;
        HBLogger.error(
            `Error occured in getShortLinkDetails : ${message} ${stack}`
        );
        return result;
    }
};

const generateShortrouteByMemberId = async (memberData) => {
    try {
        HBLogger.info(
            `habuildpaymentmanagement ~member ~generateShortrouteByMemberId  name: ${memberData?.name}`
        );
        if (!memberData?.name)
            throw new Error(
                `memberData not defined | memberData: ${memberData?.name}`
            );
        const memberNameSlug = memberData?.name
            ?.trim()
            .replace(/ /g, '')
            .replace(/[^a-zA-Z ]/g, '')
            .toLowerCase();
        let shortRoute = null;

        let maxDbCalls = 5;
        if (
            process.env.MAX_DB_CALLS &&
            parseInt(process.env.MAX_DB_CALLS) > maxDbCalls
        )
            maxDbCalls = parseInt(process.env.MAX_DB_CALLS);
        for (let i = 0; i < maxDbCalls; i++) {
            const possibleShortRoute = memberNameSlug + twoDigitRandStr();
            let result = await memberDa.processQueryWithFilters(
                GET_SHORT_ROUTE_BY_ROUTE,
                [
                    `%${possibleShortRoute}%`,
                    `%${possibleShortRoute.toLowerCase()}%`,
                ]
            );
            result = result?.rows[0];

            if (result) continue; // already a member with possible short route
            shortRoute = possibleShortRoute;
            break;
        }
        if (!shortRoute) {
            shortRoute = await shortRouteBackupGenerator(memberNameSlug);
            if (!shortRoute)
                throw new Error(
                    `Could not create short route bcz of too less uniqueness and randomness. Please try again!`
                );
        }
        return shortRoute;
    } catch (err) {
        const { message, stack } = err;
        HBLogger.error(
            `habuildpaymentmanagement ~member ~generateShortrouteByMemberId  ERROR: message: ${message} stack: ${stack}`
        );
        return null;
    }
};


const shortRouteBackupGenerator = async (memberNameSlug) => {
    try {
        HBLogger.info(
            `habuildpaymentmanagement ~member ~shortRouteBackupGenerator  memberNameSlug: ${memberNameSlug}`
        );

        const possibleShortRoute = memberNameSlug + new Date().getTime();
        let result = await memberDa.processQueryWithFilters(GET_SHORT_ROUTE_BY_ROUTE, [
            `%${possibleShortRoute}%`,
            `%${possibleShortRoute.toLowerCase()}%`,
        ]);
        result = result?.rows[0];

        if (result)
            throw new Error(
                `fail to create unique shortRoute | shortRoute: ${possibleShortRoute}`
            );
        return possibleShortRoute;
    } catch (err) {
        const { message, stack } = errerror;
        HBLogger.error(
            `habuildpaymentmanagement ~member ~shortRouteBackupGenerator  ERROR: message: ${message} stack: ${stack}`
        );
        throw err;
    }
};
const randNumberInRange = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

const twoDigitRandStr = () => {
    const randNumber = randNumberInRange(1, 99);
    if (randNumber < 10) return `0${randNumber}`;
    return String(randNumber);
};


module.exports = {
    getShortLinkDetails
}
