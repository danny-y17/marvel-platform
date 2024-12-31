const functions = require('firebase-functions');
const fetch = require('node-fetch');
const { onCall } = require('firebase-functions/v2/https');

// Replace this with your Google reCAPTCHA secret key
const RECAPTCHA_SECRET_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SECRET_KEY;

exports.verifyRecaptcha = onCall(async (data, context) => {
  const res = data;
  const token = res.data;
  try {
    // Verify the token with Google reCAPTCHA API
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${token}`,
      { method: 'POST' }
    );
    const verificationResult = await response.json();
    if (verificationResult.success) {
      return {
        results: verificationResult,
        success: true,
        message: 'reCAPTCHA verification successful.',
      };
    } else {
      throw new functions.https.HttpsError(
        'permission-denied',
        'reCAPTCHA verification failed.'
      );
    }
  } catch (error) {
    console.log(error);
    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while verifying the reCAPTCHA token.',
      error.message
    );
  }
});
