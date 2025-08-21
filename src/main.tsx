import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log("main.tsx - React check:", React ? 'React loaded' : 'React is null');
console.log("main.tsx - StrictMode check:", StrictMode ? 'StrictMode loaded' : 'StrictMode is null');

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
if (!rootElement) {
  console.error('Root element not found!');
  throw new Error('Failed to find the root element');
}

console.log("Creating React root...");
const root = createRoot(rootElement);

console.log("Rendering App with StrictMode...");
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
