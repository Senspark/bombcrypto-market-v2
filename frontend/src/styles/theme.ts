import { DefaultTheme } from 'styled-components';

export const theme: DefaultTheme = {
  colors: {
    background: '#11131b',
    surface: '#191b24',
    surfaceLight: '#242735',
    surfaceLighter: '#3a3f54',
    primary: '#ff973a',
    secondary: '#aeb5d1',
    text: '#ffffff',
    textSecondary: '#7680ab',
    success: '#3aca22',
    error: '#ff0759',
    warning: '#ffc207',
    info: '#a507ff',
    border: '#3f445b',
  },
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem',  // 8px
    md: '1rem',    // 16px
    lg: '1.5rem',  // 24px
    xl: '2rem',    // 32px
    xxl: '3rem',   // 48px
  },
  breakpoints: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1440px',
  },
  fonts: {
    primary: '"agency-fb-regular", sans-serif',
  },
};
