import { useContext, useState } from 'react';

import { Grid, Link, useTheme } from '@mui/material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { FormContainer } from 'react-hook-form-mui';
import { useDispatch } from 'react-redux';

import AuthTextField from '@/components/AuthTextField';
import GradientOutlinedButton from '@/components/GradientOutlinedButton';

import styles from './styles';

import sharedStyles from '@/styles/shared/sharedStyles';

import { AUTH_ERROR_MESSAGES } from '@/libs/constants/auth';
import ALERT_COLORS from '@/libs/constants/notification';
import ROUTES from '@/libs/constants/routes';

import useRecaptcha from '@/libs/hooks/useRecaptcha';
import { AuthContext } from '@/libs/providers/GlobalProvider';
import { setLoading } from '@/libs/redux/slices/authSlice';
import { auth, firestore } from '@/libs/redux/store';
import fetchUserData from '@/libs/redux/thunks/user';
import AUTH_REGEX from '@/libs/regex/auth';
import { setCookies } from '@/libs/services/cookies/cookieFunctions';
import { handleRecaptchaVerification } from '@/libs/services/google/captchaVerify';
import { googleSignIn } from '@/libs/services/google/googleAuth';
import { sendPasswordReset } from '@/libs/services/user/manageUser';

// Optional: If using Sentry for remote error logging
// import * as Sentry from '@sentry/nextjs';

const DEFAULT_FORM_VALUES = {
  email:
    typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'user@test.com'
      : '',
  password:
    typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'Test@123'
      : '',
};

const DEFAULT_ERR_STATE = {
  email: false,
  password: false,
};

const SignInForm = ({ handleSwitch }) => {
  const theme = useTheme();
  const [signInLoading, setSignInLoading] = useState(false);
  const [error, setError] = useState(DEFAULT_ERR_STATE);
  const [loginMethod, setLoginMethod] = useState('email');
  const dispatch = useDispatch();
  const router = useRouter();
  const { handleOpenSnackBar } = useContext(AuthContext);
  const { executeRecaptcha } = useRecaptcha();

  const handleEmailPasswordSignIn = async (data) => {
    const { email, password } = data;
    setError(DEFAULT_ERR_STATE);

    if (!email || !password) {
      setError({
        email: { message: 'Email address is required' },
        password: { message: 'Password is required' },
      });
      return;
    }

    if (!AUTH_REGEX.email.regex.test(email)) {
      setError((prev) => ({
        ...prev,
        email: { message: AUTH_REGEX.email.message },
      }));
      return;
    }

    setSignInLoading(true);

    try {
      const token = await executeRecaptcha('signin');
      const score = await handleRecaptchaVerification(token);

      if (score < 0.5) {
        sendPasswordReset(auth, email);
        handleOpenSnackBar(
          ALERT_COLORS.INFO,
          'Too many attempts, please reset your password'
        );
        return;
      }

      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const {
        user,
        _tokenResponse: { idToken },
      } = userCred;

      const handleCookies = await setCookies(idToken);
      if (!handleCookies) return;

      dispatch(setLoading(true));
      let userData;
      try {
        userData = await dispatch(
          fetchUserData({ firestore, id: user.uid })
        ).unwrap();
      } finally {
        dispatch(setLoading(false));
      }

      router.replace(userData?.needsBoarding ? ROUTES.ONBOARDING : ROUTES.HOME);
    } catch (err) {
      setError({ password: { message: AUTH_ERROR_MESSAGES[err.code] } });
    } finally {
      setSignInLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setSignInLoading(true);
      const userCred = await googleSignIn();
      if (!userCred || !userCred.user) {
        throw new Error('Google sign-in failed. No user credentials returned.');
      }
      dispatch(setLoading(true));
      const userData = await dispatch(
        fetchUserData({ firestore, id: userCred.user.uid })
      ).unwrap();
      dispatch(setLoading(false));
      router.replace(userData?.needsBoarding ? ROUTES.ONBOARDING : ROUTES.HOME);
    } catch (err) {
      const errorCode = err.code || 'unknown';
      setError({
        password: { message: AUTH_ERROR_MESSAGES[errorCode] || err.message },
      });
      handleOpenSnackBar(
        ALERT_COLORS.ERROR,
        'Google sign-in failed. Please try again.'
      );
      // If using Sentry for production error logging:
      // if (process.env.NODE_ENV === 'production') Sentry.captureException(err);
    } finally {
      setSignInLoading(false);
    }
  };

  const renderEmailInput = () => (
    <Grid {...styles.passwordGridProps}>
      <Grid {...styles.passwordInputGridProps}>
        <AuthTextField
          id="email"
          label="Email Address"
          placeholderText="Email address"
          error={!!error.email}
          helperText={error.email?.message}
          state="text"
        />
      </Grid>
    </Grid>
  );

  const renderPasswordInput = () => (
    <Grid {...styles.passwordGridProps}>
      <Grid {...styles.passwordInputGridProps}>
        <AuthTextField
          id="password"
          label="Password"
          placeholderText="Enter Password"
          error={!!error.password}
          helperText={error.password?.message}
          state="text"
          isPasswordField
        />
      </Grid>
      <Grid {...styles.forgotPasswordGridProps}>
        <Link onClick={handleSwitch} {...styles.forgotPasswordProps}>
          Forgot Password?
        </Link>
      </Grid>
    </Grid>
  );

  const handleFormSuccess = (data) => {
    if (loginMethod === 'google') {
      // If user clicked Google sign-in
      handleGoogleSignIn();
    } else {
      // Default to email/password sign-in
      handleEmailPasswordSignIn(data);
    }
  };

  const renderSubmitButton = () => (
    <GradientOutlinedButton
      bgcolor={theme.palette.Dark_Colors.Dark[1]}
      onClick={() => setLoginMethod('email')}
      text="Sign In"
      textColor={theme.palette.Common.White['100p']}
      loading={signInLoading}
      {...styles.submitButtonProps}
    />
  );

  const renderGoogleSignInButton = () => (
    <GradientOutlinedButton
      bgcolor={theme.palette.Dark_Colors.Dark[1]}
      onClick={() => setLoginMethod('google')}
      text={signInLoading ? 'Signing in...' : 'Sign In Via Google'}
      textColor={theme.palette.Common.White['100p']}
      loading={signInLoading}
      startIcon={
        <Image
          src="/google-icon-128px.png"
          alt="Google Icon"
          width={25}
          height={25}
          style={{ marginRight: 10 }}
        />
      }
      {...styles.googleButtonProps}
    />
  );

  const renderOrSeparator = () => (
    <Grid {...styles.OrSeparatorProps}>
      <span style={styles.OrSeparatorProps.text}>Or</span>
    </Grid>
  );

  return (
    <FormContainer
      defaultValues={DEFAULT_FORM_VALUES}
      onSuccess={handleFormSuccess}
    >
      <Grid {...sharedStyles.formGridProps}>
        {renderEmailInput()}
        {renderPasswordInput()}
        {renderSubmitButton()}
        {renderOrSeparator()}
        {renderGoogleSignInButton()}
      </Grid>
    </FormContainer>
  );
};

export default SignInForm;
