import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingIndicator = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-3">
        <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
      </div>
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  );
};

export default LoadingIndicator; 