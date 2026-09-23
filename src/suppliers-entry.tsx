import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import SuppliersPage from './pages/SuppliersPage';
import { UserProvider } from './context/UserContext';
import './index.css';

const rootEl = document.getElementById('react-suppliers');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <UserProvider>
        <SuppliersPage />
      </UserProvider>
    </StrictMode>
  );
}
