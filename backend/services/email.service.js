const logger = require('../utils/logger');

/**
 * Sends a transactional email using Resend API.
 * In development, if RESEND_API_KEY is not defined, it logs the email to the console.
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - Email HTML content
 * @returns {Promise<Object>} Resend API response metadata or mock status
 */
const sendMail = async ({ to, subject, html }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM || 'Health Hub <onboarding@resend.dev>';

  if (!to || !subject || !html) {
    throw new Error('Missing required email fields (to, subject, html)');
  }

  if (!apiKey || apiKey === 'your_resend_api_key' || process.env.NODE_ENV === 'test') {
    logger.info({ to, subject }, 'EMAIL_SERVICE (MOCK): Email writing to output log (no active API key set)');
    console.log('\n=================== MOCK EMAIL DISPATCH ===================');
    console.log(`TO:      ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`CONTENT:`);
    console.log(html);
    console.log('===========================================================\n');
    return {
      success: true,
      message: 'Email mocked successfully',
      id: `mock-email-id-${Date.now()}`
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        subject: subject,
        html: html
      })
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error({ error: data, to, subject }, 'Failed to send transactional email via Resend');
      throw new Error(data.message || 'Error response received from Resend API');
    }

    logger.info({ id: data.id, to, subject }, 'Transactional email sent successfully via Resend');
    return {
      success: true,
      id: data.id
    };
  } catch (error) {
    logger.error({ error: error.message, to, subject }, 'Internal error sending transactional email');
    throw error;
  }
};

module.exports = { sendMail };
