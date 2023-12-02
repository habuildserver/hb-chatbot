const INSERT_CHAT_DETAIL = `INSERT INTO memberchatdetails (id, name, chatrequesttimestamp, whatsappmessageid,
                            waticonversationid, question, answer, waid, eventtype, watiserverid)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`

module.exports = {
    INSERT_CHAT_DETAIL
};
