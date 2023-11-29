const fetch = require('node-fetch')
const HBLogger = require(process.cwd() + '/utility/logger').logger

const getEdenAIRequestOption = (query) => {
    return {
        method: 'POST',
        url: 'https://api.edenai.run/v2/aiproducts/askyoda/9e49594a-7afc-4455-8180-b39d3938ff59/ask_llm',
        headers: {
            authorization:
                'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiY2IzNGEzZTYtMTA5Yy00OWE5LTgwZjEtNWU0MmU1ZmQ0NzQ1IiwidHlwZSI6ImFwaV90b2tlbiJ9.ExMotP5sXycN-sGrInIp8eSavrR0uvsQhX2fFKoD4_4',
        },
        data: {
            query,
            llm_provider: 'openai',
            llm_model: 'text-davinci-003',
            k: 5,
        },
    }
}

const getEdenAIResponse = async (query, aiProviderData) => {
    try {
        const option = getEdenAIRequestOption(query)
        const response = await fetch(option.url, {
            method: option.method,
            headers: option.headers,
            body: JSON.stringify(option.data),
        })
        const data = await response.json()
        return data
    } catch (error) {
        const { message, stack } = error
        HBLogger.error(`Error in getEdenAIResponse: ${message} ${stack}`)
        return null
    }
}

module.exports = { getEdenAIResponse }
