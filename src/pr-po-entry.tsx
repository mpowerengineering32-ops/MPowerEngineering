import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import PurchasePage from './pages/PurchasePage';
import { UserProvider } from './context/UserContext';
import './index.css';

const rootEl = document.getElementById('react-pr-po');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <UserProvider>
        <PurchasePage />
      </UserProvider>
    </StrictMode>
  );
}
