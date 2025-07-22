import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Trash2, Clock, X } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { formatDistanceToNow, getRelativeDate } from '../../utils/dateUtils';
import toast from 'react-hot-toast';

const SessionList = ({ onClose }) => {
  const { state, actions } = useChat();
  const [deletingId, setDeletingId] = useState(null);

  const groupSessionsByDate = (sessions) => {
    const groups = {};
    sessions.forEach(session => {
      const date = new Date(session.created_at);
      const dateKey = getRelativeDate(date);
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(session);
    });
    
    return groups;
  };

  const handleDeleteSession = async (sessionId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (deletingId === sessionId) {
      // Confirm delete
      try {
        setDeletingId(null);
        await actions.deleteSession(sessionId);
        toast.success('Conversation deleted');
      } catch (error) {
        toast.error('Failed to delete conversation');
      }
    } else {
      // First click - show confirmation
      setDeletingId(sessionId);
      setTimeout(() => {
        if (deletingId === sessionId) {
          setDeletingId(null);
        }
      }, 3000);
    }
  };

  const formatTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Unknown';
    }
  };

  const groupedSessions = groupSessionsByDate(state.sessions);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto">
        {Object.keys(groupedSessions).length === 0 ? (
          <div className="p-6 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No conversations yet</h3>
            <p className="text-sm text-gray-500">Start a new conversation to see it here</p>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {Object.entries(groupedSessions).map(([dateGroup, sessions]) => (
              <div key={dateGroup}>
                {/* Date Group Header */}
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
                  {dateGroup}
                </h3>
                
                {/* Sessions in this group */}
                <div className="space-y-1">
                  {sessions.map((session) => (
                    <Link
                      key={session.id}
                      to={`/chat/${session.id}`}
                      onClick={onClose}
                      className={`group block px-3 py-3 rounded-lg transition-colors duration-200 relative ${
                        state.currentSession?.id === session.id
                          ? 'bg-primary-50 border-primary-200 text-primary-900'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {/* Title */}
                          <p className="text-sm font-medium truncate">
                            {session.title || 'New Conversation'}
                          </p>
                          
                          {/* Metadata */}
                          <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatTime(session.created_at)}
                            </span>
                            
                            {session.message_count > 0 && (
                              <span>
                                {session.message_count} message{session.message_count !== 1 ? 's' : ''}
                              </span>
                            )}
                            
                            {session.model_used && (
                              <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">
                                {session.model_used}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className={`flex-shrink-0 p-1 rounded transition-colors duration-200 ${
                            deletingId === session.id
                              ? 'text-red-600 hover:text-red-700 hover:bg-red-100'
                              : 'text-gray-400 hover:text-red-600 hover:bg-red-100 opacity-0 group-hover:opacity-100'
                          }`}
                          title={deletingId === session.id ? 'Click again to confirm deletion' : 'Delete conversation'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Active indicator */}
                      {state.currentSession?.id === session.id && (
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-r"></div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          {state.sessions.length} conversation{state.sessions.length !== 1 ? 's' : ''} total
        </p>
      </div>
    </div>
  );
};

export default SessionList; 