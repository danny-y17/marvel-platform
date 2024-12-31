const cors = require('cors');

// Initialize CORS middleware
const corsMiddleware = cors({
  origin: 'http://localhost:3000', // Allow all origins, or specify an array of allowed origins
  methods: ['GET', 'POST'], // Allow only GET and POST methods
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
});

module.exports = { corsMiddleware };
