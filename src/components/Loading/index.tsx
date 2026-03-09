import React from 'react';
import { Loader2, FileText, Search, Users, Settings } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text, 
  className = '' 
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} text-blue-600 dark:text-blue-400 animate-spin`} />
      {text && (
        <span className="ml-3 text-gray-600 dark:text-gray-400 text-sm">{text}</span>
      )}
    </div>
  );
};

interface LoadingCardProps {
  className?: string;
  rows?: number;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ className = '', rows = 3 }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-3"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
      ))}
    </div>
  </div>
);

interface LoadingPageProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({ 
  title = 'Loading...', 
  description,
  icon: Icon = FileText
}) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
    <div className="text-center">
      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
      </div>
      <LoadingSpinner size="lg" className="mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h2>
      {description && (
        <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">{description}</p>
      )}
    </div>
  </div>
);

interface LoadingListProps {
  items?: number;
  className?: string;
}

export const LoadingList: React.FC<LoadingListProps> = ({ items = 5, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: items }).map((_, i) => (
      <LoadingCard key={i} rows={2} />
    ))}
  </div>
);

interface InlineLoadingProps {
  text?: string;
  size?: 'sm' | 'md';
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({ text = 'Loading...', size = 'sm' }) => (
  <div className="flex items-center space-x-2">
    <LoadingSpinner size={size} />
    <span className="text-gray-600 dark:text-gray-400 text-sm">{text}</span>
  </div>
);