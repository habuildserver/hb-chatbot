const HBLogger = require(process.cwd() + '/utility/logger').logger
const dbHelper = require(process.cwd() + '/dataaccess/dbhelper');
const dbPoolHelper = require(process.cwd() + '/dataaccess/dbhelperpool');
const {
     
} = require(process.cwd() + '/dataaccess/query');

const { executeQuery } = require(process.cwd() + '/dataaccess/dbhelperplanetscale');

const memberDa = () => {}

memberDa.processQueryWithFilters = async (query = '', filters = []) => {
    const response = await dbHelper.executeNonQuery(query, filters)
    return response
}

memberDa.createRedirectLog = async (insertData) => {
    const queryText = `INSERT INTO public.habuild_redirect_shortlinks_logs
    (member_id, shortlink_id, short_url, long_url,"source", programid, useragent)
    VALUES(${insertData?.id},'${insertData?.shortlinkid}','${insertData?.short_url}','${insertData?.long_url}','${insertData?.source}','${insertData?.programid}','${insertData?.useragent}');`
    const queryValue = []
    const queryResult = await dbPoolHelper.executeQuery(queryText, queryValue)
    return queryResult;
}

memberDa.insertRedirectionLogsInPlanetScale = async (insertData) => {
    try {
        const queryText = `INSERT INTO ${process.env.HB_ATTENDANCE_DB_TABLE_NAME} (member_id, shortlink_id, short_url, long_url, created_at, source, programid, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        const queryValue = [insertData?.id, insertData?.shortlinkid, insertData?.short_url, insertData?.long_url, insertData?.created_at, insertData?.source, insertData?.programid, insertData?.useragent];
        const queryResult = await executeQuery(queryText, queryValue)
        return queryResult;
    } catch (err) {
        HBLogger.error(`memberDa.insertRedirectionLogsInPlanetScale error: ${err.message}`);
    }
}

memberDa.updateDeviceInfo = async (jsonObject) => {
    try {
         // Build and execute the bulk update query
  
        const queryText = `select * from updateMemberDeviceDetails($1)
      `;
        const queryValue = [jsonObject];
        const queryResult = await executeQuery(queryText, queryValue)
        return queryResult;
    } catch (err) {
        HBLogger.error(`memberDa.updateDeviceInfo error: ${err.message}`);
    }
}

module.exports = { memberDa }
