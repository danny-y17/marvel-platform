const admin = require('firebase-admin');
const { https, logger } = require('firebase-functions/v1');
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
      logger.log('generateCSRF called');
      // Check the HTTP method
      if (req.method !== 'GET') {
        logger.log('Method Not Allowed');
        return res.status(405).json({ error: 'Method Not Allowed' });
      }

      // Create a random 32-byte buffer
      const randomData = crypto.randomBytes(32);

      // Use the current timestamp as a string
      const timestamp = Buffer.from(Date.now().toString());

      // Combine random data, timestamp, and the secret key
      const secretKey = process.env.CSRF_SECRET_KEY;
      if (!secretKey) {
        logger.log('Server configuration error: CSRF_SECRET_KEY not set');
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
      const options = {
        httpOnly: true, // ✅ Prevent access from JavaScript (secure)
        secure: true, // ❌ Remove for localhost
        sameSite: 'None',
        path: '/',
      };
      res.cookie('csrfToken', hashedToken, options);
      logger.log('CSRF token generated and set as cookie');
      // Respond with the CSRF token (optional, for debugging purposes)
      res.status(200).json({ csrfToken: hashedToken });
    } catch (error) {
      logger.error('Error generating CSRF token:', error);
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

        // Guard against CSRF attacks
        console.log(req.cookies);
        if (csrfToken !== req.cookies.csrfToken) {
          logger.log(
            `CSRF token mismatch: ${csrfToken} !== ${req.cookies.csrfToken}`
          );
          return res.status(401).send('UNAUTHORIZED REQUEST!');
        }

        // Set session expiration to 5 days
        const expiresIn = 60 * 60 * 24 * 5 * 1000;

        try {
          const sessionCookie = await admin
            .auth()
            .createSessionCookie(idToken, { expiresIn });
          const options = {
            httpOnly: true, // ✅ Prevent  access from JavaScript (secure)
            secure: true, // ❌ Remove for localhost
            sameSite: 'None',
            path: '/',
          };
          // Set session cookie
          res.cookie('session', sessionCookie, options);
          logger.log('Session cookie created and set');
          console.log(req.cookies);
          res.status(200).send({ status: 'success' });
        } catch (error) {
          logger.error('Error creating session cookie:', error);
          res.status(401).send('UNAUTHORIZED REQUEST!');
        }
      } catch (error) {
        logger.error('Error in sessionLogin:', error);
        res.status(500).send('Internal Server Error');
      }
    });
  });
});

exports.clearCookies = https.onRequest((req, res) => {
  corsMiddleware(req, res, async () => {
    try {
      res.clearCookie('session', {
        httpOnly: true,
        secure: true, // Keep false for localhost
        sameSite: 'None',
        path: '/',
      });
      res.clearCookie('csrfToken', {
        httpOnly: true,
        secure: true, // Keep false for localhost
        sameSite: 'None',
      });
      res.status(200).send('Cookies cleared');
      logger.log('Session cookie cleared');
    } catch (error) {
      logger.error('Error clearing cookies:', error);
      res.status(500).send('Internal Server Error');
    }
  });
});

exports.verifyCookie = https.onRequest((req, res) => {
  corsMiddleware(req, res, async () => {
    try {
      const sessionCookie = req.cookies.session || '';
      if (!sessionCookie) {
        return res.status(401).send('Unauthorized');
      }
      admin
        .auth()
        .verifySessionCookie(sessionCookie, true)
        .then((decodedClaims) => {
          res.status(200).send({ status: 'Authorized', claims: decodedClaims });
        })
        .catch((error) => {
          logger.error('Error verifying cookie:', error);
          res.status(401).send('Unauthorized');
        });
      res.status(200).send('Authorized');
    } catch (error) {
      logger.error('Error verifying cookie:', error);
      res.redirect('/signin/');
    }
  });
});
