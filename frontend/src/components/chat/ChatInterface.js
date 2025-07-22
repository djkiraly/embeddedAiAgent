import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useChat } from '../../context/ChatContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ModelSelector from './ModelSelector';
import SessionList from './SessionList';
import LoadingIndicator from './LoadingIndicator';
import ErrorAlert from '../common/ErrorAlert';
import { Sidebar, MessageSquare } from 'lucide-react';

const ChatInterface = () => {
  const { sessionId } = useParams();
  const { state, actions } = useChat();
  const [showSessions, setShowSessions] = useState(false);
  const messagesEndRef = useRef(null);

  // Load specific session if sessionId is provided
  useEffect(() => {
    if (sessionId && sessionId !== state.currentSession?.id) {
      actions.loadSession(sessionId);
    }
  }, [sessionId, state.currentSession?.id, actions]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (message) => {
    try {
      await actions.sendMessage(message, sessionId);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const isLoading = state.isLoading && !state.currentSession;
  const isEmpty = !state.messages.length && !state.isTyping;

  return (
    <div className="flex h-screen bg-white">
      {/* Session Sidebar - Desktop */}
      <div className={`hidden lg:block w-80 border-r border-gray-200 bg-gray-50 ${showSessions ? '' : 'lg:w-0 lg:overflow-hidden'}`}>
        <SessionList />
      </div>

      {/* Session Sidebar - Mobile */}
      {showSessions && (
        <div className="lg:hidden fixed inset-0 z-50 bg-gray-600 bg-opacity-75">
          <div className="fixed inset-y-0 left-0 w-80 bg-gray-50 border-r border-gray-200">
            <SessionList onClose={() => setShowSessions(false)} />
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSessions(!showSessions)}
                className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <Sidebar className="h-6 w-6" />
              </button>
              
              <button
                onClick={() => setShowSessions(!showSessions)}
                className="hidden lg:inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors duration-200"
              >
                <MessageSquare className="h-5 w-5" />
                <span className="ml-2 text-sm font-medium">
                  {state.sessions.length} conversations
                </span>
              </button>

              {state.currentSession && (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600 truncate max-w-48">
                    {state.currentSession.title || 'New Conversation'}
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Error Alert */}
        {state.error && (
          <div className="px-4 py-2">
            <ErrorAlert 
              message={state.error} 
              onDismiss={actions.clearError}
            />
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <LoadingIndicator message="Loading conversation..." />
            </div>
          ) : isEmpty ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md mx-auto px-4">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Start a conversation
                </h3>
                <p className="text-gray-500 mb-6">
                  Choose a model and send a message to get started with AI assistance.
                </p>
                <div className="text-sm text-gray-400">
                  <p>Selected Model: <span className="font-medium text-gray-600">{state.selectedModel}</span></p>
                </div>
              </div>
            </div>
          ) : (
            <MessageList 
              messages={state.messages}
              isTyping={state.isTyping}
            />
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 bg-white">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Select Model:</label>
              <ModelSelector />
            </div>
          </div>
          <MessageInput 
            onSendMessage={handleSendMessage}
            disabled={state.isTyping || state.isLoading}
            placeholder={`Message ${state.selectedModel}...`}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface; 