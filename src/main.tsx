import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Debug: Check if React is properly loaded
console.log('React:', React);
console.log('React StrictMode:', StrictMode);
console.log('ReactDOM createRoot:', createRoot);

// Ensure React is properly loaded before continuing
if (!React || !StrictMode || !createRoot) {
  throw new Error('React dependencies are not properly loaded');
}

// Registrar Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registrado: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW falhou: ', registrationError);
      });
  });
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <App />
);
