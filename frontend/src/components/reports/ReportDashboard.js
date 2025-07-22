import React, { useState, useEffect } from 'react';
import { BarChart3, MessageSquare, Bot, TrendingUp, Download, Calendar, Users } from 'lucide-react';
import { reportService } from '../../services/api';
import LoadingIndicator from '../chat/LoadingIndicator';
import ErrorAlert from '../common/ErrorAlert';

const ReportDashboard = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportService.getReport();
      setReportData(data);
    } catch (error) {
      console.error('Failed to load report:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await reportService.exportData('json', true);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export data');
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, trend }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary-600" />
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {value}
              </div>
              {trend && (
                <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                  <TrendingUp className="w-4 h-4 flex-shrink-0 self-center text-green-500" />
                  <span className="sr-only">Increased by</span>
                  {trend}
                </div>
              )}
            </dd>
            {subtitle && (
              <dd className="text-sm text-gray-500 mt-1">
                {subtitle}
              </dd>
            )}
          </dl>
        </div>
      </div>
    </div>
  );

  const ModelUsageCard = ({ model, stats }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900">{model}</h4>
        <div className="flex items-center text-xs text-gray-500">
          <Bot className="w-3 h-3 mr-1" />
          {stats.message_count} messages
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Messages:</span>
          <span className="font-medium">{stats.message_count}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tokens:</span>
          <span className="font-medium">{stats.total_tokens?.toLocaleString() || '0'}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full" 
            style={{ 
              width: reportData ? `${(stats.message_count / Math.max(...Object.values(reportData.model_usage).map(m => m.message_count))) * 100}%` : '0%' 
            }}
          ></div>
        </div>
      </div>
    </div>
  );

  const RecentSessionCard = ({ session }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {session.title || 'Untitled Conversation'}
          </h4>
          <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500">
            <span className="flex items-center">
              <MessageSquare className="w-3 h-3 mr-1" />
              {session.message_count} messages
            </span>
            {session.model_used && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                {session.model_used}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {new Date(session.created_at).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingIndicator message="Loading analytics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="w-8 h-8 mr-3 text-primary-600" />
                Usage Analytics
              </h1>
              <p className="mt-1 text-gray-600">
                Track your AI chat usage and conversation insights
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadReport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
              >
                Refresh
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Sessions"
            value={reportData.summary.total_sessions}
            subtitle="Conversations started"
            icon={Users}
          />
          <StatCard
            title="Total Messages"
            value={reportData.summary.total_messages}
            subtitle="Messages exchanged"
            icon={MessageSquare}
          />
          <StatCard
            title="Avg. Messages/Session"
            value={reportData.summary.avg_messages_per_session}
            subtitle="Conversation depth"
            icon={TrendingUp}
          />
          <StatCard
            title="Total Tokens"
            value={reportData.summary.total_tokens?.toLocaleString() || '0'}
            subtitle="AI processing units"
            icon={Bot}
          />
        </div>

        {/* Model Usage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Model Usage
            </h2>
            <div className="grid gap-4">
              {Object.entries(reportData.model_usage || {}).map(([model, stats]) => (
                <ModelUsageCard key={model} model={model} stats={stats} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Top Models
            </h2>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-3 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <span>Model</span>
                  <span className="text-center">Messages</span>
                  <span className="text-center">Tokens</span>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {reportData.top_models?.map((model, index) => (
                  <div key={model.model} className="px-4 py-3">
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          index === 0 ? 'bg-primary-500' : 
                          index === 1 ? 'bg-green-500' : 
                          index === 2 ? 'bg-yellow-500' : 'bg-gray-400'
                        }`}></div>
                        <span className="text-sm font-medium text-gray-900">
                          {model.model}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600 text-center">
                        {model.message_count}
                      </span>
                      <span className="text-sm text-gray-600 text-center">
                        {model.total_tokens?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Conversations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportData.recent_sessions?.map((session) => (
              <RecentSessionCard key={session.id} session={session} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Report generated at {new Date(reportData.generated_at).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportDashboard; 