import React from 'react';
import MessageItem from './MessageItem';
import TypingIndicator from './TypingIndicator';

const MessageList = ({ messages = [], isTyping = false }) => {
  if (!messages.length && !isTyping) {
    return null;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {messages.map((message, index) => (
            <MessageItem
              key={message.id || index}
              message={message}
              isLastMessage={index === messages.length - 1}
            />
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <TypingIndicator />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageList; 