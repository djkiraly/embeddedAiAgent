import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChatProvider } from './context/ChatContext';
import { healthService } from './services/api';
import toast from 'react-hot-toast';

// Components
import Layout from './components/Layout';
import ChatInterface from './components/chat/ChatInterface';
import ReportDashboard from './components/reports/ReportDashboard';
import LoadingScreen from './components/common/LoadingScreen';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState(null);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const health = await healthService.check();
      setHealthStatus(health);
      
      if (health.status !== 'OK') {
        toast.error('Backend service is not responding properly');
      }
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthStatus({ status: 'ERROR', error: error.message });
      toast.error('Cannot connect to backend service');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <ChatProvider>
        <Router>
          <div className="App min-h-screen bg-gray-50">
            <Layout>
              <Routes>
                <Route path="/" element={<ChatInterface />} />
                <Route path="/chat" element={<ChatInterface />} />
                <Route path="/chat/:sessionId" element={<ChatInterface />} />
                <Route path="/reports" element={<ReportDashboard />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </div>
        </Router>
      </ChatProvider>
    </ErrorBoundary>
  );
}

export default App; 