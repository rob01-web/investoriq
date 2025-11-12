// ---------------------------------------
// InvestorIQ — Application Entry Point
// ---------------------------------------

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { Toaster } from '@/components/ui/toaster'; // for global toasts (if used)
import './index.css';

// Root React Render
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Authentication + Global Contexts */}
      <AuthProvider>
        <App />
        {/* Global Toast Notifications */}
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
