/** Theme and color palette for GM Express application */
export const THEME = {
  colors: {
    primary: '#75AA46',      // Green - Primary brand color
    secondary: '#1B2C56',    // Dark blue - Secondary brand color
    white: '#FFFFFF',
    background: '#F3F4F6',
    error: '#EF4444',
    success: '#10B981',
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
  },
} as const;

export const DEADLINE_HOUR = 10; // Daily order cutoff at 10:00 AM
export const APP_NAME = 'GM Express';
export const APP_VERSION = '1.0.0';
