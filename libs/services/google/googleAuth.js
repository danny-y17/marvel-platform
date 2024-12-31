import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

import { auth } from '../../redux/store';

/**
 * Handles Google OAuth 2.0 sign-in.
 * @returns {Promise<firebase.UserCredential>} The user's credential on successful sign-in.
 */
const googleSignIn = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result;
  } catch (error) {
    if (error.code === 'auth/network-request-failed') {
      throw new Error(
        ' Network error occurred. Please check your connection and try again.'
      );
    } else if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in process was canceled. Please try again.');
    } else {
      throw new Error(`Google sign-in failed: ${error.message}`);
    }
  }
};

/**
 * Handles signing out the user.
 */
const googleSignOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    if (error.code === 'auth/network-request-failed') {
      throw new Error(
        'Network error occurred. Please check your connection and try again.'
      );
    } else {
      throw new Error(`Google sign-out failed: ${error.message}`);
    }
  }
};

export { googleSignIn, googleSignOut };
