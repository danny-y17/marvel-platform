import { getFunctions, httpsCallable } from 'firebase/functions';

const siteKeyV3 = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
const functions = getFunctions();

/**
 * Executes Google reCAPTCHA v3 and returns the generated token.
 * @param {string} action - The reCAPTCHA action identifier (e.g., 'signin', 'signup').
 * @returns {Promise<string>} - The reCAPTCHA token.
 */
export const executeV3Recaptcha = async (action) => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.grecaptcha) {
      reject(new Error('reCAPTCHA is not loaded'));
      return;
    }

    window.grecaptcha.ready(() => {
      window.grecaptcha
        .execute(siteKeyV3, { action })
        .then(resolve)
        .catch((error) =>
          reject(new Error(`reCAPTCHA v3 execution failed: ${error.message}`))
        );
    });
  });
};

/**
 * Verifies the reCAPTCHA token using Firebase Cloud Functions.
 * @param {string} token - The reCAPTCHA token to verify.
 * @param {string} [version='v3'] - The reCAPTCHA version ('v2' or 'v3').
 * @returns {Promise<{success: boolean, score?: number}>} - Verification result.
 */
export const verifyRecaptchaToken = async (token, version = 'v3') => {
  try {
    const verifyRecaptcha = httpsCallable(functions, 'verifyRecaptcha');
    const results = await verifyRecaptcha({ token, version });

    if (version === 'v3') {
      const score = results?.data?.results?.score;
      if (score === undefined) {
        throw new Error(
          'Unexpected response format from reCAPTCHA verification.'
        );
      }
      return { success: true, score };
    }
    return { success: true };
  } catch (error) {
    throw new Error(
      error.message || 'An error occurred during reCAPTCHA verification.'
    );
  }
};

/**
 * Executes and verifies reCAPTCHA (v3 first, then v2 if needed).
 * @param {string} action - The reCAPTCHA action (e.g., 'signin', 'signup').
 * @returns {Promise<boolean>} - Returns `true` if verification succeeds.
 */
export const executeAndVerifyRecaptcha = async (action) => {
  try {
    const token = await executeV3Recaptcha(action);
    const verificationResult = await verifyRecaptchaToken(token);
    return verificationResult;
  } catch (error) {
    throw new Error(
      error.message || 'An error occurred during reCAPTCHA verification.'
    );
  }
};
