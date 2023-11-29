const HBLogger = require(process.cwd() + '/utility/logger').logger
const watiConstants = require(process.cwd() + "/utility/constants/watiTemplates");
const watiEnum = require(process.cwd() + "/utility/constants/generalStatus");

exports.watiTemplateIdentifier = async (templateName) => {
  try {
    HBLogger.info(`watiTemplateIdentifier  templateName: ${templateName}`);

    if (!templateName)
      throw new Error(
        `template name undefinded or null | templateName: ${templateName}`
      );

    if (
      String(watiConstants.WATI_TEMPLATES[templateName]).toUpperCase() ===
      String(watiEnum.WatiTemplateStatus.LEAD).toUpperCase()
    ) {
      //lead token and endpoint
      return {
        token: process.env.WATI_LEAD_TOKEN_ACTIVE,
        endpoint: process.env.WATI_LEAD_ENDPPOINT_ACTIVE,
      };
    }

    //member token and endpoint
    return {
      token: process.env.WATI_TOKEN_ACTIVE,
      endpoint: process.env.WATI_ENDPOINT_ACTIVE,
    };
  } catch (err) {
    HBLogger.error(
      `watiTemplateIdentifier  ERROR: ${JSON.stringify(
        err.message ? err.message : err
      )}`
    );
    throw err;
  }
};
