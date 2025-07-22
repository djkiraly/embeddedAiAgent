import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Settings, Eye, EyeOff, TestTube, CheckCircle, AlertCircle } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { chatService } from '../../services/api';
import toast from 'react-hot-toast';

const SettingsModal = ({ isOpen, onClose }) => {
  const { state, actions } = useChat();
  const [activeTab, setActiveTab] = useState('models');
  const [formData, setFormData] = useState({
    settings: {},
    apiKeys: {}
  });
  const [showApiKeys, setShowApiKeys] = useState({});
  const [testing, setTesting] = useState({});
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        settings: { ...state.settings },
        apiKeys: {}
      });
      setTestResults({});
    }
  }, [isOpen, state.settings]);

  const handleInputChange = (category, key, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const toggleApiKeyVisibility = (provider) => {
    setShowApiKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const testApiKey = async (provider, apiKey) => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key to test');
      return;
    }

    setTesting(prev => ({ ...prev, [provider]: true }));
    setTestResults(prev => ({ ...prev, [provider]: null }));

    try {
      const result = await chatService.testApiKey(provider, apiKey.trim());
      setTestResults(prev => ({
        ...prev,
        [provider]: { success: true, message: result.message }
      }));
      toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} API key is valid!`);
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [provider]: { success: false, message: error.message }
      }));
      toast.error(`${provider.charAt(0).toUpperCase() + provider.slice(1)} API key test failed`);
    } finally {
      setTesting(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Only send API keys that have values
      const apiKeysToSend = {};
      Object.entries(formData.apiKeys).forEach(([provider, key]) => {
        if (key && key.trim()) {
          apiKeysToSend[provider] = key.trim();
        }
      });

      await actions.updateSettings(
        formData.settings, 
        Object.keys(apiKeysToSend).length > 0 ? apiKeysToSend : null
      );
      
      toast.success('Settings updated successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const updateFormField = (category, key, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const tabs = [
    { id: 'models', name: 'Models & API Keys', icon: Settings },
    { id: 'preferences', name: 'Preferences', icon: Settings }
  ];

  const providers = [
    { id: 'openai', name: 'OpenAI', placeholder: 'sk-...' },
    { id: 'anthropic', name: 'Anthropic', placeholder: 'sk-ant-...' }
  ];

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Dialog.Title className="text-lg font-semibold text-gray-900 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Settings
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex">
            {/* Sidebar */}
            <div className="w-48 border-r border-gray-200">
              <nav className="p-4 space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'bg-primary-50 text-primary-600 border border-primary-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="p-6">
                {activeTab === 'models' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-4">
                        API Keys
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Configure your API keys to enable different AI models.
                      </p>

                      <div className="space-y-4">
                        {providers.map((provider) => (
                          <div key={provider.id} className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              {provider.name} API Key
                              {state.apiKeys[provider.id]?.isSet && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Configured
                                </span>
                              )}
                            </label>
                            
                            <div className="flex space-x-2">
                              <div className="flex-1 relative">
                                <input
                                  type={showApiKeys[provider.id] ? 'text' : 'password'}
                                  placeholder={provider.placeholder}
                                  value={formData.apiKeys[provider.id] || ''}
                                  onChange={(e) => handleInputChange('apiKeys', provider.id, e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => toggleApiKeyVisibility(provider.id)}
                                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                  {showApiKeys[provider.id] ? (
                                    <EyeOff className="w-4 h-4 text-gray-400" />
                                  ) : (
                                    <Eye className="w-4 h-4 text-gray-400" />
                                  )}
                                </button>
                              </div>
                              
                              <button
                                onClick={() => testApiKey(provider.id, formData.apiKeys[provider.id])}
                                disabled={!formData.apiKeys[provider.id]?.trim() || testing[provider.id]}
                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg transition-colors duration-200 flex items-center"
                              >
                                <TestTube className="w-4 h-4 mr-1" />
                                {testing[provider.id] ? 'Testing...' : 'Test'}
                              </button>
                            </div>

                            {/* Test Result */}
                            {testResults[provider.id] && (
                              <div className={`flex items-center text-sm mt-2 ${
                                testResults[provider.id].success ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {testResults[provider.id].success ? (
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 mr-1" />
                                )}
                                {testResults[provider.id].message}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'preferences' && (
                  <div className="space-y-6">
                    {/* Text Generation Settings */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Text Generation</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Default Model
                          </label>
                          <select
                            value={formData.settings.default_model || ''}
                            onChange={(e) => updateFormField('settings', 'default_model', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Select default model</option>
                            {state.availableModels.filter(m => m.type === 'text').map(model => (
                              <option key={model.id} value={model.id}>
                                {model.name} ({model.provider})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Tokens
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="8000"
                            value={formData.settings.max_tokens || ''}
                            onChange={(e) => updateFormField('settings', 'max_tokens', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="2000"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Temperature ({formData.settings.temperature || '0.7'})
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={formData.settings.temperature || '0.7'}
                            onChange={(e) => updateFormField('settings', 'temperature', e.target.value)}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Precise</span>
                            <span>Creative</span>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="logging_enabled"
                            checked={formData.settings.logging_enabled === 'true'}
                            onChange={(e) => updateFormField('settings', 'logging_enabled', e.target.checked ? 'true' : 'false')}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor="logging_enabled" className="ml-2 block text-sm text-gray-700">
                            Enable conversation logging
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Image Generation Settings */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Image Generation</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Default Image Size
                          </label>
                          <select
                            value={formData.settings.image_size || '1024x1024'}
                            onChange={(e) => updateFormField('settings', 'image_size', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="256x256">256×256 (Small)</option>
                            <option value="512x512">512×512 (Medium)</option>
                            <option value="1024x1024">1024×1024 (Large)</option>
                            <option value="1792x1024">1792×1024 (Landscape)</option>
                            <option value="1024x1792">1024×1792 (Portrait)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Image Quality (DALL-E 3)
                          </label>
                          <select
                            value={formData.settings.image_quality || 'standard'}
                            onChange={(e) => updateFormField('settings', 'image_quality', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="standard">Standard</option>
                            <option value="hd">HD (Higher cost)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Art Style (DALL-E 3)
                          </label>
                          <select
                            value={formData.settings.image_style || 'natural'}
                            onChange={(e) => updateFormField('settings', 'image_style', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="natural">Natural</option>
                            <option value="vivid">Vivid</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">Image Generation Tips</h3>
                            <div className="mt-2 text-sm text-blue-700">
                              <ul className="list-disc list-inside space-y-1">
                                <li>Be descriptive and specific in your prompts</li>
                                <li>HD quality uses more tokens but produces better results</li>
                                <li>Vivid style creates more dramatic, artistic images</li>
                                <li>Larger sizes take longer to generate</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default SettingsModal; 