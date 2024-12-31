import { useState } from 'react';

const siteKey = '6LeZKKAqAAAAADwZ_IabXVbkbO5qxh7R8AzMVvRd';

export default function useRecaptcha() {
  const [token, setToken] = useState(null);

  const executeRecaptcha = (action) => {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && window.grecaptcha) {
        window.grecaptcha.ready(() => {
          window.grecaptcha
            .execute(siteKey, { action })
            .then((recaptchaToken) => {
              setToken(recaptchaToken);
              // console.log(`reCAPTCHA Token (${action}):`, recaptchaToken);
              resolve(recaptchaToken);
            })
            .catch((error) => {
              console.error(`Error executing reCAPTCHA for ${action}:`, error);
              reject(error);
            });
        });
      } else {
        reject(new Error('reCAPTCHA not loaded'));
      }
    });
  };

  return { token, executeRecaptcha };
}
