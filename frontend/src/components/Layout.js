import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  MessageSquare, 
  Settings, 
  BarChart3, 
  Menu, 
  X,
  Bot,
  Plus
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import SettingsModal from './settings/SettingsModal';

const Layout = ({ children }) => {
  const location = useLocation();
  const { actions } = useChat();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    {
      name: 'Chat',
      href: '/',
      icon: MessageSquare,
      current: location.pathname === '/' || location.pathname.startsWith('/chat')
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: BarChart3,
      current: location.pathname === '/reports'
    }
  ];

  const handleNewChat = () => {
    actions.startNewSession();
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4 py-4 border-b border-gray-200">
            <Bot className="h-8 w-8 text-primary-600" />
            <h1 className="ml-3 text-xl font-bold text-gray-900">AI Chat</h1>
          </div>

          {/* New Chat Button */}
          <div className="px-4 py-4 border-b border-gray-200">
            <button
              onClick={handleNewChat}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    item.current
                      ? 'bg-primary-50 text-primary-600 border-primary-200'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${item.current ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Settings Button */}
          <div className="px-4 py-4 border-t border-gray-200">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="group w-full flex items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
            >
              <Settings className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
            <div className="ml-3 flex items-center">
              <Bot className="h-7 w-7 text-primary-600" />
              <h1 className="ml-2 text-lg font-bold text-gray-900">AI Chat</h1>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
          >
            <Settings className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="bg-white border-b border-gray-200">
            <div className="px-4 py-3 space-y-1">
              <button
                onClick={handleNewChat}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </button>
            </div>
            <nav className="px-4 pb-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`group flex items-center px-3 py-2 text-base font-medium rounded-lg transition-colors duration-200 ${
                      item.current
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`mr-4 h-6 w-6 ${item.current ? 'text-primary-500' : 'text-gray-400'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default Layout; 