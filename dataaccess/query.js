const INSERT_CHAT_DETAIL = `INSERT INTO memberchatdetails (id, name, chatrequesttimestamp, whatsappmessageid,
                            waticonversationid, question, answer, waid, eventtype, watiserverid)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`

const INSERT_CHAT_DETAILS_IN_BULK = (bulkDetails) => {
    let values = [];
    for (let chatDetail of bulkDetails) {
        values.push(`('${chatDetail?.id}', '${chatDetail?.name}', '${chatDetail?.chatrequesttimestamp}',
            '${chatDetail?.whatsappmessageid}', '${chatDetail?.waticonversationid}', '${chatDetail?.question}', '${chatDetail?.answer}',
            '${chatDetail?.waid}', '${chatDetail?.eventtype}', '${chatDetail?.watiserverid}')`)

    }
    return `INSERT INTO memberchatdetails (id, name, chatrequesttimestamp, whatsappmessageid,
                            waticonversationid, question, answer, waid, eventtype, watiserverid)
                            VALUES ${values.join(',')};`
}

module.exports = {
    INSERT_CHAT_DETAIL,
    INSERT_CHAT_DETAILS_IN_BULK
};
