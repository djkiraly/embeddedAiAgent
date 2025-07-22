import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Image } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

const MessageInput = ({ onSendMessage, disabled = false, placeholder = 'Type a message...' }) => {
  const { state } = useChat();
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef(null);

  // Determine if current model is for image generation
  const selectedModel = state.availableModels.find(m => m.id === state.selectedModel);
  const isImageModel = selectedModel?.type === 'image';

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [message]);

  // Focus on mount
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled && !isComposing) {
      onSendMessage(message.trim());
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Enter (but not Shift+Enter)
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  // Dynamic placeholder based on model type
  const getPlaceholder = () => {
    if (isImageModel) {
      return `Describe the image you want to generate with ${selectedModel.name}...`;
    }
    return placeholder;
  };

  return (
    <div className="px-4 py-4">
      {/* Image Model Notice */}
      {isImageModel && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center text-sm text-blue-800">
            <Image className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>
              <strong>{selectedModel.name}</strong> will generate an image based on your description.
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end space-x-3">
          {/* Message textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              placeholder={getPlaceholder()}
              disabled={disabled}
              rows={1}
              className={`w-full resize-none border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 ${
                disabled 
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                  : 'bg-white text-gray-900'
              }`}
              style={{
                minHeight: '50px',
                maxHeight: '120px'
              }}
            />
            
            {/* Character count for long messages */}
            {message.length > 800 && (
              <div className="absolute bottom-1 right-14 text-xs text-gray-400">
                {message.length}/4000
              </div>
            )}
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={!message.trim() || disabled || isComposing}
            className={`flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-lg transition-colors duration-200 ${
              !message.trim() || disabled || isComposing
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isImageModel
                ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                : 'bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
            }`}
            title={isImageModel ? "Generate image" : "Send message"}
          >
            {disabled ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isImageModel ? (
              <Image className="w-5 h-5" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Hint text */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>
            {isImageModel 
              ? "Describe your image in detail for best results"
              : "Press Enter to send, Shift+Enter for new line"
            }
          </span>
          {disabled && (
            <span className="flex items-center">
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
              {isImageModel ? "Generating image..." : "AI is thinking..."}
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

export default MessageInput; 