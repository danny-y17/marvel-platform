import { useContext, useRef, useState } from 'react';

import { Grid, Link, useTheme } from '@mui/material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import Image from 'next/image';
import { useRouter } from 'next/router';
import ReCAPTCHA from 'react-google-recaptcha';
import { FormContainer } from 'react-hook-form-mui';
import { useDispatch } from 'react-redux';

import AuthTextField from '@/components/AuthTextField';
import GradientOutlinedButton from '@/components/GradientOutlinedButton';

import styles from './styles';

import sharedStyles from '@/styles/shared/sharedStyles';

import { AUTH_ERROR_MESSAGES } from '@/libs/constants/auth';
import ROUTES from '@/libs/constants/routes';

import { AuthContext } from '@/libs/providers/GlobalProvider';
import { setLoading } from '@/libs/redux/slices/authSlice';
import { auth, firestore } from '@/libs/redux/store';
import fetchUserData from '@/libs/redux/thunks/user';
import AUTH_REGEX from '@/libs/regex/auth';
import { setCookies } from '@/libs/services/cookies/cookieFunctions';
import {
  executeAndVerifyRecaptcha,
  verifyRecaptchaToken,
} from '@/libs/services/GoogleServices/captchaVerify';
import { handleGoogleSignIn } from '@/libs/services/GoogleServices/googleAuth';

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

  // reCAPTCHA v2 Handling
  const [showRecaptchaV2, setShowRecaptchaV2] = useState(false);
  const recaptchaRef = useRef(null);
  const CAPTCHA_THRESHOLD = 0.5;
  // Step 1: Handle reCAPTCHA v3 first
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

    // Step 2: Execute reCAPTCHA v3 first
    const verified = await executeAndVerifyRecaptcha('signin');
    if (!verified) {
      if (verified.score < CAPTCHA_THRESHOLD) {
        setShowRecaptchaV2(true);
        return;
      }
    }

    try {
      // Step 3: Proceed with Firebase Authentication
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

  // Step 4: Handle reCAPTCHA v2 Checkbox Verification
  const handleRecaptchaV2 = async (token) => {
    const verified = await verifyRecaptchaToken(token, 'v2');
    if (verified) {
      setShowRecaptchaV2(false);
    } else {
      setShowRecaptchaV2(true);
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

  // Step 5: Render reCAPTCHA v2 Checkbox
  const renderRecaptchaV2 = () =>
    showRecaptchaV2 && (
      <ReCAPTCHA
        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_V2_SITE_KEY}
        size="normal" // Uses checkbox mode instead of invisible
        ref={recaptchaRef}
        onChange={handleRecaptchaV2}
      />
    );

  const handleFormSuccess = (data) => {
    if (loginMethod === 'google') {
      handleGoogleSignIn(
        dispatch,
        router,
        handleOpenSnackBar,
        setError,
        setSignInLoading
      );
    } else {
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
        {renderRecaptchaV2()}
        {renderSubmitButton()}
        {renderOrSeparator()}
        {renderGoogleSignInButton()}
      </Grid>
    </FormContainer>
  );
};

export default SignInForm;
