import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-gray-400 mb-6 max-w-md">
            The application encountered an unexpected error.
          </p>
          <div className="bg-black/50 p-4 rounded-lg text-left overflow-auto max-w-full w-full mb-6 border border-red-500/30">
            <p className="text-red-400 font-mono text-sm mb-2">{this.state.error && this.state.error.toString()}</p>
            <pre className="text-gray-500 text-xs">{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-xl font-bold transition-colors"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;