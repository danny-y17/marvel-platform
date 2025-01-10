const functions = require('firebase-functions');
const fetch = require('node-fetch');
const { logger } = require('firebase-functions/v1');
const { onCall } = require('firebase-functions/v2/https');

// Replace this with your Google reCAPTCHA secret key
const recaptchaV3Key = process.env.NEXT_PUBLIC_RECAPTCHA_SECRET_KEY;
const recaptchaV2Key = process.env.NEXT_PUBLIC_RECAPTCHA_V2_SECRET_KEY;

if (!recaptchaV3Key || !recaptchaV2Key) {
  logger.error('Missing reCAPTCHA secret keys in environment variables.');
  throw new Error('Missing reCAPTCHA secret keys.');
}

exports.verifyRecaptcha = onCall(async (data, context) => {
  const res = data;
  const { token, version } = res.data;

  // Select the correct secret key
  const secretKey = version === 'v3' ? recaptchaV3Key : recaptchaV2Key;

  try {
    // Verify the token with Google reCAPTCHA API
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`,
      { method: 'POST' }
    );
    const verificationResult = await response.json();
    if (verificationResult.success) {
      logger.info('reCAPTCHA verification successful.', { verificationResult });
      return {
        results: verificationResult,
        success: true,
        message: 'reCAPTCHA verification successful.',
      };
    } else {
      logger.warn('reCAPTCHA verification failed.', { verificationResult });
      throw new functions.https.HttpsError(
        'permission-denied',
        'reCAPTCHA verification failed.'
      );
    }
  } catch (error) {
    logger.error('An error occurred while verifying the reCAPTCHA token.', {
      error,
    });
    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while verifying the reCAPTCHA token.',
      error.message
    );
  }
});
