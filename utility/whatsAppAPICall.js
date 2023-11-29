const HBLogger = require(process.cwd() + '/utility/logger').logger
const GeneralStatus = require(process.cwd() +
    '/utility/constants/generalStatus')
const NotificationSources = require(process.cwd() +
    '/utility/constants/NotificationSources')
const moment = require('moment')
const dbHelper = require(process.cwd() + '/dataaccess/dbhelper')
const fetch = require('node-fetch')
const axios = require('axios')

exports.whatsAppAPICallWithLogs = async (data, memberId, templateName) => {
    recievers.push({
        whatsappNumber: curr_member.mobile_number,
        customParams: custom_params,
    })
    try {
        HBLogger.info(
            `whatsAppAPICallWithLogs call templateName: ${templateName}`
        )
        const watiData = await watiTemplate.watiTemplateIdentifier(templateName)
        let watiResult = await fetch(
            `${watiData.endpoint}/api/v1/sendTemplateMessages`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${watiData.token}`,
                },
                body: JSON.stringify(data),
            }
        )
        watiResult = await watiResult.json()
        HBLogger.info(`result from wati ${JSON.stringify(watiResult)}`)
        if (!watiResult.result) {
            HBLogger.error(
                `Failed to send messages : ${JSON.stringify(watiResult)}`
            )
            if (watiResult.message == undefined) {
                HBLogger.info(watiResult)
                HBLogger.error(
                    `wati message undefined : ${JSON.stringify(watiResult)}`
                )
            }
        } else {
            HBLogger.info(
                'message sent successfully : ' + JSON.stringify(watiResult)
            )
            const date = moment(new Date()).add(5.5, 'hours')
            let dateText = date.toString()
            let message = JSON.stringify(watiResult)
            message = message.replace(/'/g, '')
            let insertData = {
                member_id: memberId,
                template_identifier: templateName,
                date: dateText,
                message: message,
            }

            await addToCommunicationLog(insertData)
        }
    } catch (err) {
        HBLogger.error(err)
    }
}

exports.whatsAppAPICall = async (programid, memberId, SenderData, templateName) => {
    HBLogger.info(`whatsAppAPICall call in`)
    try {
        let customParams = await GetCustomParams(templateName, SenderData, programid)

        let Receiver = [
            {
                whatsappNumber: "+" + SenderData.mobileNumber,
                customParams: customParams,
            },
        ]

        const data = {
            template_name: templateName,
            broadcast_name:
                templateName + ' ' + moment(new Date()).add(5.5, 'hours'),
            receivers: Receiver,
        }
        HBLogger.info(`whatsAppAPICall call in ${data}`)
        let watiResult = await fetch(
            `${process.env.WATI_ENDPOINT_ACTIVE}/api/v1/sendTemplateMessages`,
            {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${process.env.WATI_TOKEN_ACTIVE}`,
                },
                body: JSON.stringify(data),
            }
        )
        watiResult = await watiResult.json()
        HBLogger.info(`result from wati ${JSON.stringify(watiResult)}`)
        if (!watiResult.result) {
            HBLogger.error(
                `Failed to send messages : ${JSON.stringify(watiResult)}`
            )
            if (watiResult.message == undefined) {
                HBLogger.info(watiResult)
                HBLogger.error(
                    `wati message undefined : ${JSON.stringify(watiResult)}`
                )
            }
        } else {
            HBLogger.info(
                'message sent successfully : ' + `${JSON.stringify(watiResult)}`
            )
            const date = moment(new Date()).add(5.5, 'hours')
            let dateText = date.toString()
            HBLogger.info(`addToCommunicationLog SERVICE`)
            let message = JSON.stringify(watiResult)
            message = message.replace(/'/g, '')
            let insertData = {
                member_id: memberId,
                template_identifier: templateName,
                date: dateText,
                message: message,
                programid: programid
            }
            await addToCommunicationLog(insertData)
        }
    } catch (err) {
        HBLogger.error(`whatsAppAPICall ERROR ${err}`)
    }
}
const GetCustomParams = async (templateName, SenderData, programid) => {
    HBLogger.info(
        `GetCustomParams call in templateName ${templateName}  SenderData ${JSON.stringify(
            SenderData
        )}`
    )
    let customParams = []

    const tempData = await GetNotificationTemplate(templateName, programid)
    const templateVariables = JSON.parse(tempData?.variable)

    for (let item of templateVariables) {
        if (SenderData[item.paramName]) {
            customParams.push({
                name: item.paramName,
                value: SenderData[item.paramName],
            })
        }
    }
    HBLogger.info(`GetCustomParams call end customParams ${customParams}`)
    return customParams
}

const GetNotificationTemplate = async (templateName, programid) => {
    let result = []
    const queryText = `select identifier,body,variable from habuild_notification_template hnt where identifier ='${templateName}' and programid = '${programid}'`
    const queryValue = []
    const queryResult = await dbHelper.executeNonQuery(queryText, queryValue)
    if (queryResult?.rowCount > 0) {
        result = queryResult.rows[0]
    }
    return result
}

const addToCommunicationLog = async (insertData) => {
    const queryText = `INSERT INTO public.habuild_communication_log
                    (member_id, "date", status,  "mode",template_identifier, message,programid)
                    VALUES(${insertData?.member_id},'${insertData?.date}','${GeneralStatus.NotificationStatus.SUCCESS}','${NotificationSources.NotificationSources.WHATSAPP}','${insertData?.template_identifier}','${insertData?.message}','${insertData?.programid}');`
    const queryValue = []
    const queryResult = await dbHelper.executeNonQuery(queryText, queryValue)
    return queryResult
}

/**
 * Updates Wati Params (of single member) as per data stored in database.
 * @param {string} mobileNumber - User's mobile number stored in habuild_members
 * @param {Object} customParams - Object containing field name as reqd in WA
 * @returns // PENDING
 */
exports.updateWatiCustomParams = async (
    mobileNumber,
    customParams,
    _watiEndpoint = process.env.WATI_ENDPOINT_ACTIVE,
    _watiToken = process.env.WATI_TOKEN_ACTIVE
) => {
    const watiApiEndpoint = `${_watiEndpoint}/api/v1/updateContactAttributes/${mobileNumber}`
    const watiAuthorizatonBearerToken = `Bearer ${_watiToken}`
    try {
        const paramKeys = Object.keys(customParams)
        const watiNameValuePairs = paramKeys.reduce((acc, curr) => {
            const watiNameValuePair = {
                name: curr,
                value: customParams[curr],
            }
            if (watiNameValuePair.value) acc.push(watiNameValuePair)
            return acc
        }, [])

        HBLogger.info(
            `updateWatiCustomParams ~ whatsappMessage data:  ${JSON.stringify(
                watiNameValuePairs
            )}`
        )

        const watiPostData = {
            customParams: watiNameValuePairs,
        }

        HBLogger.info(`updateWatiCustomParams ~ updatingWatiCustomParams`)
        HBLogger.info(`watiPostData: ${JSON.stringify(watiPostData)}`)
        const watiResult = await axios.post(watiApiEndpoint, watiPostData, {
            headers: {
                Authorization: watiAuthorizatonBearerToken,
            },
        })
        HBLogger.info(
            `updateWatiCustomParams ~ result from wati ${JSON.stringify(
                watiResult.data
            )}`
        )
        return watiResult
    } catch (err) {
        HBLogger.error(
            `updateWatiCustomParams ~  ERROR: ${JSON.stringify(
                err.message ? err.message : err
            )}`
        )
        throw err
    }
}
const processQueryWithFilters = async (query = '', filters = []) => {
    const response = await dbHelper.executeNonQuery(query, filters)
    return response
}