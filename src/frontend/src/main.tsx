import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { setupErrorFiltering } from '@/lib';
import { ErrorProvider } from '@/contexts/error-context';

// Setup error filtering for development
setupErrorFiltering();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorProvider>
      <App />
    </ErrorProvider>
  </React.StrictMode>
);