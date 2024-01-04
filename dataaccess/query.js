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
select m."name", m.waid, hwd.endpoint, m.question, m.answer, m.createdat, m.waticonversationid  from memberchatdetails m inner join habuild_watiserver_details hwd
on m.watiserverid = hwd.watiserverid  
where waid ilike $1 order by m.createdat desc;
`;
const INSERT_MEDIA_CHAT_DETAILS = `INSERT INTO membermediachat (name, chatrequesttimestamp, whatsappmessageid, url, waid, eventtype, watiserverid)
                                   VALUES ($1, $2, $3, $4, $5, $6, $7)`;

const SELECT_MEMBER_MEDIA_CHAT_DETAILS = `select * from membermediachat order by membermediachatid`;

const UPDATE_RESOLVED_STATUS = `
update membermediachat set isresolved = $2 
where membermediachatid = $1
`;

module.exports = {
    INSERT_CHAT_DETAIL,
    INSERT_CHAT_DETAILS_IN_BULK,
    SELECT_MEMBER_CHAT_DETAILS,
    INSERT_MEDIA_CHAT_DETAILS,
    SELECT_MEMBER_MEDIA_CHAT_DETAILS,
    UPDATE_RESOLVED_STATUS,
};
