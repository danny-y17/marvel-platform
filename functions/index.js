require('dotenv').config({ path: '../.env' }); // Ensure this is at the top
const admin = require('firebase-admin');

admin.initializeApp();

const userController = require('./controllers/userController');
const marvelAIController = require('./controllers/marvelAIController');
const googleController = require('./controllers/googleController');
const cookieController = require('./controllers/cookieController');
const { seedDatabase } = require('./cloud_db_seed');

seedDatabase();

/* Migration Scripts */
// const {
// } = require("./migrationScripts/modifyChallengePlayersData");
const migrationScripts = {};

module.exports = {
  /* Authenticaition */
  signUpUser: userController.signUpUser,
  /* Cookie session */
  sessionLogin: cookieController.sessionLogin,
  generateCSRF: cookieController.generateCSRF,
  clearCookies: cookieController.clearCookies,
  verifyCookie: cookieController.verifyCookie,
  /* Marvel AI */
  chat: marvelAIController.chat,
  createChatSession: marvelAIController.createChatSession,
  /* Google features */
  verifyRecaptcha: googleController.verifyRecaptcha,
  /* Migration Scripts - For running  */
  ...migrationScripts,
};
