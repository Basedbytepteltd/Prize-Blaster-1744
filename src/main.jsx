import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

console.log('🚀 Main.jsx executing...');

// Ensure DOM is ready
const init = () => {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error("❌ CRITICAL: Root element not found!");
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#1a1a2e;color:white;text-align:center;padding:20px;font-family:system-ui,-apple-system,sans-serif;">
        <div>
          <h1 style="font-size:48px;margin-bottom:20px;">⚠️</h1>
          <h2 style="margin-bottom:10px;">Application Error</h2>
          <p style="color:#999;margin-bottom:20px;">Root element not found. Please refresh the page.</p>
          <button onclick="window.location.reload()" style="margin-top:20px;padding:12px 24px;background:#10B981;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px;font-weight:600;">
            Reload Application
          </button>
        </div>
      </div>
    `;
    return;
  }

  try {
    console.log('✅ Root element found, rendering React app...');
    const root = ReactDOM.createRoot(rootElement);
    
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    
    console.log('✅ React app rendered successfully');
  } catch (error) {
    console.error("❌ Failed to render app:", error);
    rootElement.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#1a1a2e;color:white;text-align:center;padding:20px;font-family:system-ui,-apple-system,sans-serif;">
        <div>
          <h1 style="font-size:48px;margin-bottom:20px;">⚠️</h1>
          <h2 style="margin-bottom:10px;">Render Error</h2>
          <p style="color:#999;margin-bottom:10px;">${error.message}</p>
          <pre style="background:#000;padding:10px;border-radius:4px;text-align:left;font-size:12px;overflow:auto;max-width:90vw;margin:20px auto;">${error.stack}</pre>
          <button onclick="window.location.reload()" style="margin-top:20px;padding:12px 24px;background:#10B981;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px;font-weight:600;">
            Reload Application
          </button>
        </div>
      </div>
    `;
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  console.log('⏳ Waiting for DOM...');
  document.addEventListener('DOMContentLoaded', init);
} else {
  console.log('✅ DOM already ready');
  init();
}