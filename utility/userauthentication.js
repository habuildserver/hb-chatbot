const HBLogger = require(process.cwd() + '/utility/logger').logger
const { commonFunctions } = require(process.cwd() + '/utility/commonfunctions')

let authenticationBusiness = () => ({})

// middleware to test if authenticated
authenticationBusiness.isAuthenticated = (req, res, next) => {
    if (req && req.session && req.session.user) {
        res.locals.data = { isAuthenticated: true }
    } else {
        res.locals.data = { isAuthenticated: false }
        res.status(401).send(
            commonFunctions.createResponse({}, { message: 'Unauthorized' })
        )
    }
}

module.exports = {
    authenticationBusiness,
}
