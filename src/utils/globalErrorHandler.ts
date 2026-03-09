interface ErrorInfo {
  componentStack?: string;
  errorBoundary?: boolean;
  errorMessage?: string;
}

class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  
  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  init() {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    
    // Catch global JavaScript errors
    window.addEventListener('error', this.handleGlobalError);
    
    // Handle React errors (in development)
    if (process.env.NODE_ENV === 'development') {
      window.addEventListener('error', this.handleReactError);
    }
  }

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Prevent the default browser behavior
    event.preventDefault();
    
    // Log error to monitoring service
    this.logError('unhandled_promise_rejection', event.reason);
  };

  private handleGlobalError = (event: ErrorEvent) => {
    console.error('Global error:', event.error);
    
    // Log error to monitoring service
    this.logError('global_error', event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  };

  private handleReactError = (event: ErrorEvent) => {
    if (event.error?.stack?.includes('React')) {
      console.error('React error:', event.error);
      this.logError('react_error', event.error);
    }
  };

  private logError(type: string, error: any, extra?: any) {
    // In production, you would send this to an error monitoring service
    // like Sentry, LogRocket, or similar
    const errorLog = {
      type,
      message: error?.message || String(error),
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...extra
    };

    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorLog);
    } else {
      // Send to monitoring service
      // monitoring.captureError(errorLog);
    }
  }

  cleanup() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('error', this.handleReactError);
  }
}

export const initGlobalErrorHandler = () => {
  return GlobalErrorHandler.getInstance().init();
};

export const cleanupGlobalErrorHandler = () => {
  return GlobalErrorHandler.getInstance().cleanup();
};