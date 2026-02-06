import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      background: string;
      surface: string;
      surfaceLight: string;
      surfaceLighter: string;
      primary: string;
      secondary: string;
      text: string;
      textSecondary: string;
      success: string;
      error: string;
      warning: string;
      info: string;
      border: string;
    };
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
    breakpoints: {
      mobile: string;
      tablet: string;
      desktop: string;
    };
    fonts: {
      primary: string;
    };
  }
}
