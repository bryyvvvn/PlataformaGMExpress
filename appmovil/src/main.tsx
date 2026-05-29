import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ClerkProvider } from '@clerk/clerk-react';
import { esES } from '@clerk/localizations';
import { CLERK_CONFIG } from './constants/clerk';

/**
 * Validate Clerk publishable key exists before rendering.
 * This key is required for Clerk authentication to function.
 */
const publishableKey = CLERK_CONFIG.publishableKey;
if (!publishableKey) {
  throw new Error('Missing Clerk publishable key. Please set VITE_CLERK_PUBLISHABLE_KEY environment variable.');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found in HTML document.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={publishableKey}
      localization={esES}
      appearance={CLERK_CONFIG.appearance}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
);