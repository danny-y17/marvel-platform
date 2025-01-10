import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

import { auth } from '../../redux/store';

import { AUTH_ERROR_MESSAGES } from '@/libs/constants/auth';
import ALERT_COLORS from '@/libs/constants/notification';
import ROUTES from '@/libs/constants/routes';
import { setLoading } from '@/libs/redux/slices/authSlice';
import { firestore } from '@/libs/redux/store';
import { fetchUserData } from '@/libs/redux/thunks/user';
import { setCookies } from '@/libs/services/cookies/cookieFunctions';

/**
 * Handles Google OAuth 2.0 sign-in, fetches user data, and updates Redux state.
 *
 * @param {Function} dispatch - Redux dispatch function
 * @param {Function} router - Next.js router instance
 * @param {Function} handleOpenSnackBar - Snackbar notification function
 * @param {Function} setError - Function to update error state
 * @param {Function} setSignInLoading - React state setter for loading
 */
const handleGoogleSignIn = async (
  dispatch,
  router,
  handleOpenSnackBar,
  setError,
  setSignInLoading
) => {
  const provider = new GoogleAuthProvider();

  try {
    setSignInLoading(true);
    const userCred = await signInWithPopup(auth, provider);

    if (!userCred?.user) {
      throw new Error('Google sign-in failed. No user credentials returned.');
    }
    const idToken = await userCred.user.getIdToken();
    await setCookies(idToken);

    dispatch(setLoading(true));

    const userData = await dispatch(
      fetchUserData({ firestore, id: userCred.user.uid })
    ).unwrap();

    dispatch(setLoading(false));
    router.replace(userData?.needsBoarding ? ROUTES.ONBOARDING : ROUTES.HOME);
  } catch (error) {
    handleOpenSnackBar(ALERT_COLORS.ERROR, 'Google Sign-In Error:', error);

    // Ensure error object exists before accessing properties
    const errorCode = error?.code || 'unknown_error';
    const errorMessage =
      AUTH_ERROR_MESSAGES[errorCode] ||
      error?.message ||
      'Google sign-in failed. Please try again.';
    // Handle known Firebase errors like "popup-closed-by-user"
    if (errorCode) {
      handleOpenSnackBar(ALERT_COLORS.ERROR, errorMessage);
      setSignInLoading(false);
      return;
    }
    setError((prev) => ({
      ...prev,
      password: { message: errorMessage },
    }));
    handleOpenSnackBar(ALERT_COLORS.ERROR, errorMessage);
  } finally {
    setSignInLoading(false); // ✅ Stop loading
  }
};

/**
 * Handles signing out the user from Google authentication.
 * @returns {Promise<void>} Resolves when sign-out is successful.
 * @throws {Error} Throws an error if sign-out fails.
 */
const googleSignOut = async (handleOpenSnackBar) => {
  try {
    await signOut(auth);
  } catch (error) {
    handleOpenSnackBar('Google Sign-Out Error:', error);
    throw new Error(`Google sign-out failed: ${error.message}`);
  }
};

export { handleGoogleSignIn, googleSignOut };
