import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './auth/AuthProvider';
import { StoreProvider } from './data/store';
import { ToastProvider } from './components/Toast';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <StoreProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
