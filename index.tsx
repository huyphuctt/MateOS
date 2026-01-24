
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ModalProvider } from './contexts/ModalContext';
import { GlobalProvider } from './contexts/GlobalContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <GlobalProvider>
        <ModalProvider>
          <App />
        </ModalProvider>
      </GlobalProvider>
    </AuthProvider>
  </React.StrictMode>
);
