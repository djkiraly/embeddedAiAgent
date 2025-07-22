import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">AI Chat Interface</h2>
        <p className="text-gray-600">{message}</p>
        <div className="mt-4 flex items-center justify-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen; 