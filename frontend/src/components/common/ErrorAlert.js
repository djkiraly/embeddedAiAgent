import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ErrorAlert = ({ message, onDismiss, type = 'error' }) => {
  const baseClasses = 'rounded-lg p-4 flex items-start space-x-3 animate-fade-in';
  
  const typeStyles = {
    error: 'bg-red-50 border border-red-200',
    warning: 'bg-yellow-50 border border-yellow-200',
    info: 'bg-blue-50 border border-blue-200'
  };

  const iconStyles = {
    error: 'text-red-600',
    warning: 'text-yellow-600', 
    info: 'text-blue-600'
  };

  const textStyles = {
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800'
  };

  return (
    <div className={`${baseClasses} ${typeStyles[type]}`}>
      <div className="flex-shrink-0">
        <AlertCircle className={`w-5 h-5 ${iconStyles[type]}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${textStyles[type]}`}>
          {message}
        </p>
      </div>

      {onDismiss && (
        <div className="flex-shrink-0">
          <button
            onClick={onDismiss}
            className={`inline-flex rounded-md p-1.5 hover:bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              type === 'error' 
                ? 'text-red-500 hover:bg-red-100 focus:ring-red-500' 
                : type === 'warning'
                ? 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-500'
                : 'text-blue-500 hover:bg-blue-100 focus:ring-blue-500'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ErrorAlert; 