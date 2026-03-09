import React from 'react';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Wifi, 
  Server, 
  FileX, 
  Shield, 
  Clock 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export type ErrorType = 
  | 'network'
  | 'server'
  | 'notFound'
  | 'unauthorized'
  | 'forbidden'
  | 'timeout'
  | 'generic';

interface ErrorDisplayProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  details?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
  className?: string;
}

const errorConfig = {
  network: {
    icon: Wifi,
    title: 'Connection Problem',
    defaultMessage: 'Unable to connect to the server. Please check your internet connection.',
    color: 'text-orange-600 dark:text-orange-400'
  },
  server: {
    icon: Server,
    title: 'Server Error',
    defaultMessage: 'Something went wrong on our end. Please try again later.',
    color: 'text-red-600 dark:text-red-400'
  },
  notFound: {
    icon: FileX,
    title: 'Not Found',
    defaultMessage: 'The requested resource could not be found.',
    color: 'text-gray-600 dark:text-gray-400'
  },
  unauthorized: {
    icon: Shield,
    title: 'Authentication Required',
    defaultMessage: 'You need to sign in to access this resource.',
    color: 'text-yellow-600 dark:text-yellow-400'
  },
  forbidden: {
    icon: Shield,
    title: 'Access Denied',
    defaultMessage: 'You do not have permission to access this resource.',
    color: 'text-red-600 dark:text-red-400'
  },
  timeout: {
    icon: Clock,
    title: 'Request Timeout',
    defaultMessage: 'The request took too long to complete. Please try again.',
    color: 'text-orange-600 dark:text-orange-400'
  },
  generic: {
    icon: AlertTriangle,
    title: 'Something went wrong',
    defaultMessage: 'An unexpected error occurred. Please try again.',
    color: 'text-red-600 dark:text-red-400'
  }
};

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  type = 'generic',
  title,
  message,
  details,
  onRetry,
  showHomeButton = true,
  className = ''
}) => {
  const config = errorConfig[type];
  const Icon = config.icon;

  return (
    <div className={`text-center p-6 ${className}`} data-testid="error-display">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
        type === 'network' ? 'bg-orange-100 dark:bg-orange-900/30' :
        type === 'server' || type === 'forbidden' ? 'bg-red-100 dark:bg-red-900/30' :
        type === 'unauthorized' || type === 'timeout' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
        'bg-gray-100 dark:bg-gray-800'
      }`}>
        <Icon className={`w-8 h-8 ${config.color}`} />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title || config.title}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
        {message || config.defaultMessage}
      </p>

      {details && (
        <details className="mb-4 text-left bg-gray-100 dark:bg-gray-800 rounded-lg p-4 max-w-lg mx-auto">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Error Details
          </summary>
          <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto whitespace-pre-wrap">
            {details}
          </pre>
        </details>
      )}
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        )}
        
        {showHomeButton && (
          <Link
            to="/"
            className="flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Link>
        )}
        
        {type === 'unauthorized' && (
          <Link
            to="/admin/login"
            className="flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <Shield className="w-4 h-4 mr-2" />
            Sign In
          </Link>
        )}
      </div>
    </div>
  );
};

export const ErrorPage: React.FC<ErrorDisplayProps> = (props) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
    <div className="max-w-md w-full">
      <ErrorDisplay {...props} />
    </div>
  </div>
);

interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  size?: 'sm' | 'md';
}

export const InlineError: React.FC<InlineErrorProps> = ({ message, onRetry, size = 'sm' }) => (
  <div className={`flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg ${
    size === 'sm' ? 'text-sm' : 'text-base'
  }`}>
    <div className="flex items-center">
      <AlertTriangle className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} text-red-600 dark:text-red-400 mr-2`} />
      <span className="text-red-700 dark:text-red-300">{message}</span>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="ml-2 p-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
      >
        <RefreshCw className="w-4 h-4" />
      </button>
    )}
  </div>
);