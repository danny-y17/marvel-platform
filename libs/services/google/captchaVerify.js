import { getFunctions, httpsCallable } from 'firebase/functions';
// Initialize and connect to the emulator
const functions = getFunctions();
/**
 * Function to handle reCAPTCHA verification.
 * @param {string} token - The reCAPTCHA token to verify.
 * @returns {Promise<object>} - The verification result or error details.
 */
const handleRecaptchaVerification = async (token) => {
  try {
    const verifyRecaptcha = httpsCallable(functions, 'verifyRecaptcha');
    const result = await verifyRecaptcha(token);
    const { score } = result.data.results;
    return score;
  } catch (error) {
    console.error('Error during reCAPTCHA verification:', error.message);
    // Return the error to the caller for further handling
    return { error: true, message: error.message };
  }
};

export { handleRecaptchaVerification };
