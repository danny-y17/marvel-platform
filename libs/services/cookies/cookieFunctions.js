import axios from 'axios';

// Function to generate CSRF token
export const generateCSRF = async () => {
  try {
    const csrfURL =
      'http://127.0.0.1:5001/marvelai-c7b53/us-central1/generateCSRF';
    const response = await axios.get(csrfURL, {
      withCredentials: true, // Ensure cookies are included
    }); // Ensure cookies are included
    return response.data.csrfToken;
  } catch (error) {
    console.error(
      'Error generating CSRF token:',
      error.response?.data || error.message
    );
    throw error;
  }
};

// Function to perform session login
export const sessionLogin = async (idToken, csrfToken) => {
  const url = 'http://127.0.0.1:5001/marvelai-c7b53/us-central1/sessionLogin';
  try {
    const response = await axios.post(
      url,
      {
        idToken,
        csrfToken,
      },
      {
        withCredentials: true, // Ensure cookies are included
      }
    );
    console.log(response);
    return response.data;
  } catch (error) {
    console.error(
      'Error in session login:',
      error.response?.data || error.message
    );
    throw error;
  }
};

// Combined function (if needed)
export const setCookies = async (idToken) => {
  try {
    const csrfToken = await generateCSRF(); // Generate CSRF token if not present
    // Step 2: Perform session login
    const loginResponse = await sessionLogin(idToken, csrfToken);
    console.log(loginResponse);
    console.log('Session login successful:', loginResponse);
    return loginResponse;
  } catch (error) {
    console.error(
      'Error setting cookies:',
      error.response?.data || error.message
    );
    throw error;
  }
};

// clear session cookies
export const clearCookies = async () => {
  try {
    const url = 'http://127.0.0.1:5001/marvelai-c7b53/us-central1/clearCookies';
    const response = await axios.get(url, {
      withCredentials: true,
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(
      'Error clearing cookies:',
      error.response?.data || error.message
    );
    throw error;
  }
};
