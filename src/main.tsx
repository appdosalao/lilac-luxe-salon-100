import React from './reactAvailability';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ensureReactAvailability } from './reactAvailability';

// Ensure React is available before proceeding
if (!ensureReactAvailability()) {
  document.body.innerHTML = '<div style="padding: 20px; font-family: Arial; color: red;">React não está disponível. Por favor, recarregue a página.</div>';
  throw new Error('React is not properly loaded');
}

// Debug: Check if React is properly loaded
console.log('React availability check passed');
console.log('React:', React);
console.log('ReactDOM createRoot:', createRoot);

// Final safety check
if (!createRoot) {
  throw new Error('ReactDOM createRoot is not available');
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
