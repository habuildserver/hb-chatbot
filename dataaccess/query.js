const INSERT_CHAT_DETAIL = `INSERT INTO memberchatdetails (id, name, chatrequesttimestamp, whatsappmessageid,
                            waticonversationid, question, answer, waid, eventtype, watiserverid, responder)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);`

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

const SELECT_MEMBER_CHAT_DETAILS = `
  SELECT m."name", m.waid, hwd.endpoint, m.question, m.answer, m.createdat 
  FROM memberchatdetails m 
  INNER JOIN habuild_watiserver_details hwd ON m.watiserverid = hwd.watiserverid 
  WHERE m.waid = $1 
  ORDER BY m.createdat DESC;`;

module.exports = {
    INSERT_CHAT_DETAIL,
    INSERT_CHAT_DETAILS_IN_BULK,
    SELECT_MEMBER_CHAT_DETAILS
};
