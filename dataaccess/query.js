const INSERT_CHAT_DETAIL = `INSERT INTO memberchatdetails (id, mobilenumber, name, chatrequesttimestamp,
                            whatsappmessageid, waticonversationid, question, answer, responder, waid, eventtype, watiserverid, inactive)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);`

module.exports = {
    INSERT_CHAT_DETAIL
};
