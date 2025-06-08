import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'regenerator-runtime/runtime';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './lib/AuthContext';

// Register service worker
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

// Use the correct Google Client ID based on environment
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 
  '1234567890-example.apps.googleusercontent.com'; // Fallback to prevent errors

// Helper to determine if we're in production
const isProduction = window.location.hostname === 'personify.mobi' || 
                     window.location.hostname === 'www.personify.mobi';

// Log environment info for debugging (will be removed in production build)
if (!isProduction) {
  console.log('Development environment detected');
  console.log('Using Google Client ID:', GOOGLE_CLIENT_ID);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>
);