const admin = require('firebase-admin');
const { https } = require('firebase-functions/v1');
const crypto = require('crypto');
const { corsMiddleware } = require('../middlewares/corsMiddleware');
const cookieParser = require('cookie-parser');

/**
 * HTTP endpoint to create a CSRF.
 *
 * @async
 * @function generateCSRF
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
exports.generateCSRF = https.onRequest((req, res) => {
  corsMiddleware(req, res, async () => {
    try {
      // Check the HTTP method
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
      }

      // Create a random 32-byte buffer
      const randomData = crypto.randomBytes(32);

      // Use the current timestamp as a string
      const timestamp = Buffer.from(Date.now().toString());

      // Combine random data, timestamp, and the secret key
      const secretKey = process.env.CSRF_SECRET_KEY;
      if (!secretKey) {
        return res.status(500).json({ error: 'Server configuration error' });
      }

      const dataToHash = Buffer.concat([
        randomData,
        timestamp,
        Buffer.from(secretKey),
      ]);

      // Hash the combined data using SHA256
      const hashedToken = crypto
        .createHash('sha256')
        .update(dataToHash)
        .digest('hex');

      // Set the CSRF token as an HTTP-only cookie
      const cookieOptions = {
        httpOnly: true,
        secure: true, // Set to true in production (requires HTTPS)
        sameSite: 'None', // Protect against CSRF attacks
        maxAge: 60 * 60 * 24 * 5 * 1000, // 5 days
      };
      res.cookie('__session', hashedToken, cookieOptions);
      // Respond with the CSRF token (optional, for debugging purposes)
      res.status(200).json({ csrfToken: hashedToken });
    } catch (error) {
      console.error('Error generating CSRF token:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
});

/**
 * HTTP endpoint to create a session cookie.
 *
 * @async
 * @function sessionLogin
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
exports.sessionLogin = https.onRequest((req, res) => {
  corsMiddleware(req, res, async () => {
    cookieParser()(req, res, async () => {
      try {
        const idToken = req.body.idToken;
        const csrfToken = req.body.csrfToken;

        console.log(`idToken: ${idToken}`);
        console.log(`csrfToken: ${csrfToken}`);
        console.log('Parsed Cookies: ', req.cookies);

        // Guard against CSRF attacks
        if (csrfToken !== req.cookies.__session) {
          console.log(`${csrfToken} !== ${req.cookies.__session}`);
          return res.status(401).send('UNAUTHORIZED REQUEST!');
        }

        // Set session expiration to 5 days
        const expiresIn = 60 * 60 * 24 * 5 * 1000;

        try {
          const sessionCookie = await admin
            .auth()
            .createSessionCookie(idToken, { expiresIn });
          const options = {
            maxAge: expiresIn,
            httpOnly: true,
            secure: true, // Set to true for HTTPS
            sameSite: 'None', // Protect against CSRF
          };
          // Set session cookie
          res.cookie('session', sessionCookie, options);
          res.status(200).send({ status: 'success' });
        } catch (error) {
          console.error('Error creating session cookie:', error);
          res.status(401).send('UNAUTHORIZED REQUEST!');
        }
      } catch (error) {
        console.error('Error in sessionLogin:', error);
        res.status(500).send('Internal Server Error');
      }
    });
  });
});

exports.clearCookies = https.onRequest((req, res) => {
  corsMiddleware(req, res, async () => {
    try {
      res.clearCookie('session', {
        path: '/', // Match the path where the cookie was set
        secure: true, // Secure in production
        httpOnly: true, // Match HttpOnly setting
        sameSite: 'None', // Match SameSite attribute
      });
      res.redirect('/signin');
    } catch (error) {
      console.error('Error clearing cookies:', error);
      res.status(500).send('Internal Server Error');
    }
  });
});
