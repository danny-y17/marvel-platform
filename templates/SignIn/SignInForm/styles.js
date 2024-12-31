const styles = {
  EmailGridProps: {
    position: 'relative',
    container: true,
    rowGap: 1,
    mt: -1,
  },
  EmailInputGridProps: {
    item: true,
    mobileSmall: 12,
  },
  passwordGridProps: {
    position: 'relative',
    container: true,
    rowGap: 1,
    mt: -1,
  },
  passwordInputGridProps: {
    item: true,
    mobileSmall: 12,
  },
  forgotPasswordGridProps: {
    position: 'absolute',
    right: 0,
    bottom: (theme) => ({
      laptop: `-${theme.spacing(1.5)}`, // Adjusted bottom spacing
      desktop: `-${theme.spacing(2.5)}`, // Adjusted bottom spacing
      desktopMedium: `-${theme.spacing(3.5)}`, // Adjusted bottom spacing
    }),
    container: true,
    item: true,
    mobileSmall: 12,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  forgotPasswordProps: {
    component: 'button',
    type: 'button',
    fontFamily: 'Satoshi Bold',
    fontSize: { laptop: '12px', desktopMedium: '14px' },
    sx: {
      mr: 1,
      textDecoration: 'underline',
      textUnderlineOffset: '3px',
      color: (theme) => theme.palette.Greyscale[50],
      '&:hover': {
        cursor: 'pointer',
      },
    },
  },
  submitButtonProps: {
    type: 'submit',
    color: 'purple4',
    inverted: true,
    extraProps: {
      padding: '2px',
      height: { laptop: '54px', desktopMedium: '60px' },
      width: '70%',
      mt: -1, // Increased margin-top to shift up more
    },
    extraButtonProps: {
      fontFamily: 'Satoshi Bold',
      fontSize: '16px',
      px: 4,
    },
  },
  googleButtonProps: {
    type: 'submit',
    color: 'darkgray1',
    inverted: true,
    extraProps: {
      padding: '2px',
      height: { laptop: '54px', desktopMedium: '60px' },
      width: '70%',
      mt: -3, // Increased margin-top to shift up more
    },
    extraButtonProps: {
      fontFamily: 'Satoshi Bold',
      fontSize: '16px',
      px: 4,
    },
  },

  OrSeparatorProps: {
    container: true,
    alignItems: 'center',
    justifyContent: 'center',
    sx: {
      mt: -2, // Add some spacing between buttons and separator
      mb: -2, // Add some spacing after separator
      '&::before, &::after': {
        content: '""',
        flex: 1,
        borderBottom: '1px solid',
        borderColor: (theme) => theme.palette.Greyscale[200],
        mx: 1, // Space around "or"
      },
    },
    text: {
      fontFamily: 'Satoshi Bold', // Updated to match bold style
      fontSize: '16px', // Increased font size for emphasis
      color: (theme) => theme.palette.Greyscale[600],
    },
  },
};

export default styles;
