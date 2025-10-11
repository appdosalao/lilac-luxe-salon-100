import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Service Worker is managed by Vite PWA plugin - no manual registration needed

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(<App />);
