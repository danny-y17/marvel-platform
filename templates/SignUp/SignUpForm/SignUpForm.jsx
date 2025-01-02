import { useContext, useState } from 'react';

import { Grid, useTheme } from '@mui/material';
import { useRouter } from 'next/router';
import { FormContainer } from 'react-hook-form-mui';
import { useDispatch } from 'react-redux';

import AuthTextField from '@/components/AuthTextField';
import GradientOutlinedButton from '@/components/GradientOutlinedButton';

import styles from './styles';

import sharedStyles from '@/styles/shared/sharedStyles';

import {
  AUTH_ERROR_MESSAGES,
  AUTH_STEPS,
  VALIDATION_STATES,
} from '@/libs/constants/auth';

import ALERT_COLORS from '@/libs/constants/notification';
import ROUTES from '@/libs/constants/routes';
import useWatchFields from '@/libs/hooks/useWatchFields';
import { AuthContext } from '@/libs/providers/GlobalProvider';
import { firestore } from '@/libs/redux/store';
import fetchUserData from '@/libs/redux/thunks/user';
import AUTH_REGEX from '@/libs/regex/auth';
import { googleSignIn } from '@/libs/services/google/googleAuth';
import { signUp } from '@/libs/services/user/signUp';
import { validatePassword } from '@/libs/utils/AuthUtils';

const DEFAULT_FORM_VALUES = {
  email: '',
  fullName: '',
  password: '',
  reEnterPassword: '',
};

const DEFAULT_ERR_STATE = {
  email: false,
  fullName: false,
  password: false,
  reEnterPassword: false,
};

const WATCH_FIELDS = [
  { fieldName: 'password', regexPattern: AUTH_REGEX.password.regex },
  { fieldName: 'reEnterPassword', regexPattern: AUTH_REGEX.password.regex },
  { fieldName: 'email', regexPattern: AUTH_REGEX.email.regex },
  { fieldName: 'fullName', regexPattern: AUTH_REGEX.fullName.regex },
];

/**
 * Sign up form component that handles user registration.
 *
 * @param {object} props - The properties passed to the component.
 * @param {string} props.step - The current step in the sign-up process.
 * @param {function} props.setStep - A function to update the current step.
 * @param {function} props.handleSwitch - A function to switch between sign-up and verify email view.
 * @param {function} props.setEmail - A function to set the user's email in the parent component/state.
 * @return {JSX.Element} Returns Sign-Up Form.
 */
const SignUpForm = ({ step, setStep, setEmail, handleSwitch }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const router = useRouter();
  const { handleOpenSnackBar } = useContext(AuthContext);

  // Local states for errors and loading
  const [error, setError] = useState(DEFAULT_ERR_STATE);
  const [loading, setLoading] = useState(false); // For email+password flow
  const [googleLoading, setGoogleLoading] = useState(false); // For Google flow

  // React-hook-form-mui watch fields
  const { register, control, fieldStates } = useWatchFields(WATCH_FIELDS);
  const { email, fullName, password, reEnterPassword } = fieldStates;
  const passwordMatch = password.value === reEnterPassword.value;

  // Helper function for reEnterPassword validation state
  const setReEnterPasswordStatus = () => {
    if (passwordMatch && password.valid && reEnterPassword.valid) {
      return VALIDATION_STATES.SUCCESS;
    }
    if (!password.value) return VALIDATION_STATES.DEFAULT;
    return VALIDATION_STATES.ERROR;
  };

  const submitButtonText = () =>
    step === AUTH_STEPS.EMAIL ? 'Continue' : 'Sign Up';

  /**
   * This function will be called by onSuccess (from FormContainer),
   * meaning the form is "valid" from react-hook-form-mui's perspective.
   * Here, we handle the multi-step logic for email + password sign-up.
   */
  const handleFormSuccess = async () => {
    // Multi-step logic
    if (step === AUTH_STEPS.EMAIL) {
      // Ensure fullName and email are valid
      if (fullName.valid && email.valid) {
        setStep(AUTH_STEPS.PASSWORD);
        return;
      }

      // Show errors if missing
      setError({
        email: !email.valid ? { message: 'Email address is required' } : false,
        fullName: !fullName.valid
          ? { message: 'Full name is required' }
          : false,
      });
      return;
    }

    // If we are at the password step, validate them
    const isPasswordValid = validatePassword(
      { reEnterPassword: reEnterPassword.value, password: password.value },
      setError
    );

    if (isPasswordValid) {
      setLoading(true);
      try {
        // Perform your sign-up logic here
        await signUp(email.value, password.value, fullName.value);
        handleOpenSnackBar(
          ALERT_COLORS.SUCCESS,
          'Account created successfully'
        );

        // For your post-sign-up flow
        setEmail(email.value);
        handleSwitch(); // Switch to "verify email" or next step
      } catch (err) {
        handleOpenSnackBar(ALERT_COLORS.ERROR, err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  /**
   * Google Sign-In flow (bypasses the form).
   */
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const userCred = await googleSignIn();
      dispatch(setLoading(true)); // <-- If you're using your Redux-based setLoading
      const userData = await dispatch(
        fetchUserData({ firestore, id: userCred.user.uid })
      ).unwrap();
      dispatch(setLoading(false));

      router.replace(userData?.needsBoarding ? ROUTES.ONBOARDING : ROUTES.HOME);
    } catch (err) {
      // If err is shaped { code }, we can show a more specific message
      const { code } = err || {};
      setError((prev) => ({
        ...prev,
        password: {
          message: AUTH_ERROR_MESSAGES[code] || 'Google sign-in failed',
        },
      }));
      handleOpenSnackBar(
        ALERT_COLORS.ERROR,
        'Google sign-in failed. Please try again.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  // ---- Renderers for fields based on steps ----
  const renderEmailInput = () => {
    if (step !== AUTH_STEPS.EMAIL) return null;
    return (
      <AuthTextField
        id="email"
        name="email"
        label="Email Address"
        placeholderText="Email address"
        error={!!error.email}
        helperText={
          !email.valid && email.value
            ? AUTH_REGEX.email.message
            : error.email?.message
        }
        state={email.status}
        control={control}
        ref={register}
        focused
      />
    );
  };

  const renderFullNameInput = () => {
    if (step !== AUTH_STEPS.EMAIL) return null;
    return (
      <AuthTextField
        id="fullName"
        name="fullName"
        label="Full Name"
        placeholderText="Full name"
        error={!!error.fullName}
        helperText={
          !fullName.valid && fullName.value
            ? AUTH_REGEX.fullName.message
            : error.fullName?.message
        }
        state={fullName.status}
        control={control}
        ref={register}
        focused
      />
    );
  };

  const renderPasswordAndConfirmPasswordInputs = () => {
    if (step === AUTH_STEPS.EMAIL) return null;
    return (
      <>
        <AuthTextField
          id="password"
          name="password"
          label="Password"
          placeholderText="Enter Password"
          error={!!error.password}
          helperText={
            !password.valid && password.value
              ? AUTH_REGEX.password.message
              : error.password?.message
          }
          state={password.status}
          control={control}
          ref={register}
          isPasswordField
          focused
        />
        <AuthTextField
          id="reEnterPassword"
          name="reEnterPassword"
          label="Re-Enter Password"
          placeholderText="Re-Enter Password"
          error={!!error.reEnterPassword}
          helperText={
            !passwordMatch && password.value
              ? 'Password does not match'
              : error.reEnterPassword?.message
          }
          state={setReEnterPasswordStatus()}
          control={control}
          ref={register}
          isPasswordField
          focused
        />
      </>
    );
  };

  // Button for email/password sign-up
  const renderSubmitButton = () => (
    <GradientOutlinedButton
      bgcolor={theme.palette.Dark_Colors.Dark[1]}
      loading={step === AUTH_STEPS.PASSWORD && loading}
      textColor={theme.palette.Common.White['100p']}
      text={submitButtonText()}
      {...styles.submitButtonProps}
    />
  );

  // Google button: outside the form to skip validation
  const renderGoogleSignInButton = () => (
    <GradientOutlinedButton
      bgcolor={theme.palette.Dark_Colors.Dark[1]}
      onClick={handleGoogleSignIn}
      text={googleLoading ? 'Signing up...' : 'Sign Up Via Google'}
      textColor={theme.palette.Common.White['100p']}
      loading={googleLoading}
      {...styles.googleButtonProps}
    />
  );

  return (
    <>
      {/* 
        1) The FormContainer handles only the Email/Password flow.
        2) onSuccess calls handleFormSuccess, which checks each step.
      */}
      <FormContainer
        defaultValues={DEFAULT_FORM_VALUES}
        onSuccess={handleFormSuccess}
      >
        <Grid {...sharedStyles.formGridProps}>
          {renderEmailInput()}
          {renderFullNameInput()}
          {renderPasswordAndConfirmPasswordInputs()}
          {renderSubmitButton()}
        </Grid>
      </FormContainer>

      {/* 
        Google button is OUTSIDE the form container, so it never gets blocked by validations.
      */}
      <Grid container justifyContent="center" marginTop={2}>
        {renderGoogleSignInButton()}
      </Grid>
    </>
  );
};

export default SignUpForm;
