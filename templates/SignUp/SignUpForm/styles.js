const styles = {
  submitButtonProps: {
    color: 'purple4',
    inverted: true,
    extraProps: {
      padding: '2px',
      height: { laptop: '54px', desktopMedium: '60px' },
      width: '65%',
      mt: -1,
    },
    extraButtonProps: {
      fontFamily: 'Satoshi Bold',
      fontSize: '16px',
      px: 4,
    },
  },

  googleButtonProps: {
    type: 'submit',
    color: 'purple4',
    inverted: true,
    extraProps: {
      padding: '2px',
      height: { laptop: '54px', desktopMedium: '60px' },
      width: '65%',
      mt: -6, // Increased margin-top to shift up more
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
      mt: -4, // Add some spacing between buttons and separator
      mb: 0, // Add some spacing after separator
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
