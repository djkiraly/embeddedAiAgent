import React from 'react';
import { Bot } from 'lucide-react';

const TypingIndicator = () => {
  return (
    <div className="flex max-w-3xl w-full space-x-3 animate-fade-in">
      {/* Avatar */}
      <div className="flex-shrink-0 mr-3">
        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Typing indicator */}
      <div className="flex-1 min-w-0">
        <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3">
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span className="text-sm text-gray-500 ml-2">AI is typing...</span>
          </div>
        </div>
        
        {/* Metadata placeholder */}
        <div className="mt-1">
          <div className="text-xs text-gray-500">
            <span>Thinking...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator; 