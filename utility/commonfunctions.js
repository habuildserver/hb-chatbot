const HBLogger = require(process.cwd() + '/utility/logger').logger;
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
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

commonFunctions.inputParamRequired = (inputObj, checkParams) => {
    // const reqErrMsg=[];
    const missingProps = checkParams.filter(
        (p) =>
            !(
                Object.keys(inputObj).includes(p) &&
                inputObj[p] !== undefined &&
                inputObj[p] !== null &&
                trimHelper(inputObj[p]) !== ''
            )
    );

    // if(missingProp && missingProp.length>0)
    // {
    //     missingProp.forEach(element => {
    //         reqErrMsg.push(`${element} is required.`);
    //     });
    // }
    return missingProps;
};

/* ------------------------- Date utility functions ------------------------- */
/**
 * assume ->
 * 	today: 2022-10-27T14:16:43.447Z
 * then ->
 * 	today.getDate(): 27
 * 	today.getDay(): 4 [sunday: 0, monday: 1, ...]
 * 	currentWeekMondayDate: 24 (date of current week's monday)
 * 	monday: 2022-10-24T14:22:14.113Z
 * @returns monday
 */
commonFunctions.getMondayOfCurrentWeek = () => {
    const today = new Date();
    const currentWeekMondayDate = today.getDate() - today.getDay() + 1;
    const monday = new Date(today.setDate(currentWeekMondayDate));
    return monday;
};

/**
 * assume ->
 * 	currentDate: 2022-10-27T14:16:43.447Z
 * 	subDays: 2
 * then ->
 * 	currentDateObj: 2022-10-27T14:16:43.447Z
 * 	newDateObj: 2022-10-25T14:33:18.339Z
 * @returns newDateObj
 */
commonFunctions.subtractDaysFromDate = (currentDate, subDays = 0) => {
    const currentDateObj = new Date(currentDate);
    const newDateObj = new Date(
        currentDateObj.setDate(currentDateObj.getDate() - Number(subDays))
    );
    return newDateObj;
};

const trimHelper = (input) =>
    typeof input === 'string' ? input.trim() : input;

commonFunctions.registerUserOnZoomMeeting = async (input) => {
    try {
        HBLogger.info(
            'registerUserOnZoomMeeting input' + JSON.stringify(input)
        );
        const name = input?.name.trim();
        const token = jwt.sign(
            {
                iss: process.env.ZOOM_API_KEY,
                exp: 1496091964000,
            },
            process.env.ZOOM_API_SECRET
        );
        let lastName = 'Habuilder';
        let firstName = name.split(' ')[0];
        if (name.split(' ').length > 1)
            lastName = name.split(' ').slice(-1).join(' ');

        let zoom_link_generated = '';

        let zoomResult = await fetch(
            `https://api.zoom.us/v2/meetings/${input?.meetingId}/registrants/status`,
            {
                method: 'PUT',
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    action: 'approve',
                    registrants: [{ email: String(input?.email).trim() }],
                }),
            }
        );
        HBLogger.info(`Zoom result: ${JSON.stringify(zoomResult?.status)}`);
        zoom_link_generated = zoomResult?.join_url;

        if (!zoom_link_generated) {
            const approveZoomResult = await fetch(
                `https://api.zoom.us/v2/meetings/${input?.meetingId}/registrants`,
                {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        email: String(input?.email).trim(),
                        first_name: firstName,
                        last_name: lastName,
                        phone: input?.mobileNumber,
                    }),
                }
            );
            if (!approveZoomResult || approveZoomResult?.status != 204)
                throw new Error(
                    `enable to change registration status | ERROR:${JSON.stringify(
                        approveZoomResult.status
                    )}`
                );

            let innerZoomResult = await fetch(
                `https://api.zoom.us/v2/meetings/${input?.meetingId}/registrants`,
                {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        email: String(input?.email).trim(),
                        first_name: firstName,
                        last_name: lastName,
                        phone: input?.mobileNumber,
                    }),
                }
            );
            zoom_link_generated = innerZoomResult?.join_url;
        }
        HBLogger.info(
            `zoom result join url: ${JSON.stringify(zoom_link_generated)}`
        );
        return zoom_link_generated;
    } catch (err) {
        HBLogger.error(
            `registerUserOnZoomMeeting zoomService ERROR: ${JSON.stringify(
                err.message ? err.message : err
            )}`
        );
        throw err;
    }
};

commonFunctions.get_env = async (key) => {
    if (process.env.NODE_ENV == 'production') {
        return null;
    }
};

commonFunctions.registerUserOnYouTube = async (shortRoute) =>
    `${process.env.PROXY_URL}${shortRoute}`;
module.exports = {
    requestWatch,
    commonFunctions,
};
