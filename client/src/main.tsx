import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const isDebug = import.meta.env.VITE_BUILD_TYPE === 'debug';

if (isDebug) {
  console.log('[DEBUG BUILD] Telemetry & Debugging active.');
}

window.addEventListener('error', (event) => {
  if (isDebug) {
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `<div style="color:red;padding:20px;z-index:9999;position:absolute;top:0;background:white;">${event.error?.stack || event.message}</div>`;
    }
  }
});
window.addEventListener('unhandledrejection', (event) => {
  if (isDebug) {
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `<div style="color:red;padding:20px;z-index:9999;position:absolute;top:0;background:white;">${event.reason?.stack || event.reason}</div>`;
    }
  }
});

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    if (isDebug) {
        console.error("React ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError && isDebug) {
      return (
        <div style={{ padding: '20px', color: 'red', backgroundColor: 'white', position: 'absolute', top: 0, left: 0, zIndex: 9999, width: '100%', minHeight: '100vh' }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
