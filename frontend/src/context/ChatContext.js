import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { chatService } from '../services/api';

const ChatContext = createContext();

// Initial state
const initialState = {
  currentSession: null,
  sessions: [],
  messages: [],
  selectedModel: 'gpt-3.5-turbo',
  availableModels: [],
  isLoading: false,
  isTyping: false,
  settings: {
    default_model: 'gpt-3.5-turbo',
    max_tokens: '2000',
    temperature: '0.7',
    logging_enabled: 'true'
  },
  apiKeys: {},
  error: null
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_TYPING: 'SET_TYPING',
  SET_ERROR: 'SET_ERROR',
  SET_SESSIONS: 'SET_SESSIONS',
  SET_CURRENT_SESSION: 'SET_CURRENT_SESSION',
  SET_MESSAGES: 'SET_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  SET_SELECTED_MODEL: 'SET_SELECTED_MODEL',
  SET_AVAILABLE_MODELS: 'SET_AVAILABLE_MODELS',
  SET_SETTINGS: 'SET_SETTINGS',
  SET_API_KEYS: 'SET_API_KEYS',
  CLEAR_ERROR: 'CLEAR_ERROR',
  CREATE_NEW_SESSION: 'CREATE_NEW_SESSION',
  UPDATE_SESSION: 'UPDATE_SESSION'
};

// Reducer function
function chatReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    
    case actionTypes.SET_TYPING:
      return { ...state, isTyping: action.payload };
    
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false, isTyping: false };
    
    case actionTypes.CLEAR_ERROR:
      return { ...state, error: null };
    
    case actionTypes.SET_SESSIONS:
      return { ...state, sessions: action.payload };
    
    case actionTypes.SET_CURRENT_SESSION:
      return { ...state, currentSession: action.payload };
    
    case actionTypes.SET_MESSAGES:
      return { ...state, messages: action.payload };
    
    case actionTypes.ADD_MESSAGE:
      return { ...state, messages: [...state.messages, action.payload] };
    
    case actionTypes.SET_SELECTED_MODEL:
      return { ...state, selectedModel: action.payload };
    
    case actionTypes.SET_AVAILABLE_MODELS:
      return { ...state, availableModels: action.payload };
    
    case actionTypes.SET_SETTINGS:
      return { 
        ...state, 
        settings: { ...state.settings, ...action.payload }
      };
    
    case actionTypes.SET_API_KEYS:
      return { ...state, apiKeys: action.payload };
    
    case actionTypes.CREATE_NEW_SESSION:
      const newSession = action.payload;
      return {
        ...state,
        currentSession: newSession,
        sessions: [newSession, ...state.sessions],
        messages: []
      };
    
    case actionTypes.UPDATE_SESSION:
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === action.payload.id ? { ...session, ...action.payload } : session
        )
      };
    
    default:
      return state;
  }
}

// Context provider component
export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Poll for available models every 2 minutes
  useEffect(() => {
    const pollModels = async () => {
      try {
        const modelsResponse = await chatService.getModels();
        dispatch({ type: actionTypes.SET_AVAILABLE_MODELS, payload: modelsResponse.models });
      } catch (error) {
        console.warn('Failed to refresh models:', error);
        // Don't set error state for polling failures to avoid interrupting user experience
      }
    };

    // Poll every 2 minutes (120 seconds)
    const interval = setInterval(pollModels, 120000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const loadInitialData = async () => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });

      // Load available models
      const modelsResponse = await chatService.getModels();
      dispatch({ type: actionTypes.SET_AVAILABLE_MODELS, payload: modelsResponse.models });

      // Load settings
      const settingsResponse = await chatService.getSettings();
      dispatch({ type: actionTypes.SET_SETTINGS, payload: settingsResponse.settings });
      dispatch({ type: actionTypes.SET_API_KEYS, payload: settingsResponse.apiKeys });

      // Set default model from settings
      const defaultModel = settingsResponse.settings.default_model || 'gpt-3.5-turbo';
      dispatch({ type: actionTypes.SET_SELECTED_MODEL, payload: defaultModel });

      // Load recent sessions
      const sessionsResponse = await chatService.getSessions();
      dispatch({ type: actionTypes.SET_SESSIONS, payload: sessionsResponse.sessions });

    } catch (error) {
      console.error('Failed to load initial data:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  };

  // Actions
  const actions = {
    sendMessage: async (message, sessionId = null) => {
      try {
        dispatch({ type: actionTypes.SET_TYPING, payload: true });
        dispatch({ type: actionTypes.CLEAR_ERROR });

        // Add user message immediately
        const userMessage = {
          id: Date.now().toString(),
          content: message,
          role: 'user',
          timestamp: new Date().toISOString(),
          session_id: sessionId || state.currentSession?.id
        };
        dispatch({ type: actionTypes.ADD_MESSAGE, payload: userMessage });

        // Send to API
        const response = await chatService.sendMessage({
          message,
          model: state.selectedModel,
          sessionId: sessionId || state.currentSession?.id
        });

        // Add AI response
        dispatch({ type: actionTypes.ADD_MESSAGE, payload: response.message });

        // Update current session if new
        if (!state.currentSession || state.currentSession.id !== response.session.id) {
          dispatch({ type: actionTypes.SET_CURRENT_SESSION, payload: response.session });
        }

        // Update session in list
        dispatch({ type: actionTypes.UPDATE_SESSION, payload: response.session });

        return response;
      } catch (error) {
        console.error('Send message error:', error);
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: actionTypes.SET_TYPING, payload: false });
      }
    },

    loadSession: async (sessionId) => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        dispatch({ type: actionTypes.CLEAR_ERROR });

        const response = await chatService.getSession(sessionId);
        dispatch({ type: actionTypes.SET_CURRENT_SESSION, payload: response.session });
        dispatch({ type: actionTypes.SET_MESSAGES, payload: response.messages });
      } catch (error) {
        console.error('Load session error:', error);
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      } finally {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    },

    startNewSession: () => {
      dispatch({ type: actionTypes.SET_CURRENT_SESSION, payload: null });
      dispatch({ type: actionTypes.SET_MESSAGES, payload: [] });
    },

    setSelectedModel: (model) => {
      dispatch({ type: actionTypes.SET_SELECTED_MODEL, payload: model });
    },

    updateSettings: async (newSettings, newApiKeys = null) => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });

        const response = await chatService.updateSettings({
          settings: newSettings,
          apiKeys: newApiKeys
        });

        dispatch({ type: actionTypes.SET_SETTINGS, payload: response.settings });
        if (response.apiKeys) {
          dispatch({ type: actionTypes.SET_API_KEYS, payload: response.apiKeys });
        }

        return response;
      } catch (error) {
        console.error('Update settings error:', error);
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      } finally {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    },

    refreshSessions: async () => {
      try {
        const response = await chatService.getSessions();
        dispatch({ type: actionTypes.SET_SESSIONS, payload: response.sessions });
      } catch (error) {
        console.error('Refresh sessions error:', error);
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      }
    },

    deleteSession: async (sessionId) => {
      try {
        await chatService.deleteSession(sessionId);
        
        // Remove from sessions list
        const updatedSessions = state.sessions.filter(s => s.id !== sessionId);
        dispatch({ type: actionTypes.SET_SESSIONS, payload: updatedSessions });
        
        // Clear current session if it was deleted
        if (state.currentSession?.id === sessionId) {
          dispatch({ type: actionTypes.SET_CURRENT_SESSION, payload: null });
          dispatch({ type: actionTypes.SET_MESSAGES, payload: [] });
        }
      } catch (error) {
        console.error('Delete session error:', error);
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    clearError: () => {
      dispatch({ type: actionTypes.CLEAR_ERROR });
    },

    refreshModels: async () => {
      try {
        const modelsResponse = await chatService.getModels();
        dispatch({ type: actionTypes.SET_AVAILABLE_MODELS, payload: modelsResponse.models });
        return modelsResponse.models;
      } catch (error) {
        console.error('Refresh models error:', error);
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    }
  };

  return (
    <ChatContext.Provider value={{ state, actions }}>
      {children}
    </ChatContext.Provider>
  );
}

// Custom hook to use chat context
export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

export default ChatContext; 