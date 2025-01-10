import { kaiAPI } from '@/libs/utils/apiClient'; // ✅ Import the Axios instance

// Function to generate CSRF token
export const generateCSRF = async () => {
  try {
    const response = await kaiAPI.get('generateCSRF'); // ✅ Shortened endpoint
    return response.data.csrfToken;
  } catch (error) {
    throw new Error(
      `Error generating CSRF token: ${error.response?.data || error.message}`
    );
  }
};

// Function to perform session login
export const sessionLogin = async (idToken, csrfToken) => {
  try {
    const response = await kaiAPI.post('sessionLogin', {
      idToken,
      csrfToken,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      `Error in session login: ${error.response?.data || error.message}`
    );
  }
};

// Combined function
export const setCookies = async (idToken) => {
  try {
    const csrfToken = await generateCSRF();
    const res = await sessionLogin(idToken, csrfToken);
    return res;
  } catch (error) {
    throw new Error(
      `Error setting cookies: ${error.response?.data || error.message}`
    );
  }
};

// Clear session cookies (different Firebase project)
export const clearCookies = async () => {
  try {
    const response = await kaiAPI.get('clearCookies'); // Uses kaiAPI instance
    return response.data;
  } catch (error) {
    throw new Error(
      `Error clearing cookies: ${error.response?.data || error.message}`
    );
  }
};

// verify cookies for route protection
export const verifyCookies = async () => {
  try {
    const response = await kaiAPI.get('verifyCookies'); // Uses kaiAPI instance
    return response.data;
  } catch (error) {
    throw new Error(
      `Error verifying cookies: ${error.response?.data || error.message}`
    );
  }
};
