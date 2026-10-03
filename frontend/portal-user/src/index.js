import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from "./App";

// Neutraliser l'overlay d'erreur ResizeObserver en mode développement
window.addEventListener('error', (e) => {
  if (e?.message?.includes('ResizeObserver') || e?.message?.includes('undelivered notifications')) {
    const resizeObserverErrDiv = document.getElementById('webpack-dev-server-client-overlay');
    if (resizeObserverErrDiv) {
      resizeObserverErrDiv.style.display = 'none';
    }
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
);
