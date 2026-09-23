import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import BillingPage from './pages/BillingPage';
import { UserProvider } from './context/UserContext';
import './index.css';

const rootEl = document.getElementById('react-billing');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <UserProvider>
        <BillingPage />
      </UserProvider>
    </StrictMode>
  );
}
