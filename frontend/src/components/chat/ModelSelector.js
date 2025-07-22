import React, { Fragment, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronDownIcon, CheckIcon, Bot, RefreshCw, Image, MessageSquare } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import clsx from 'clsx';

const ModelSelector = () => {
  const { state, actions } = useChat();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getModelDisplayName = (modelId) => {
    const model = state.availableModels.find(m => m.id === modelId);
    return model ? model.name : modelId;
  };

  const getModelType = (modelId) => {
    const model = state.availableModels.find(m => m.id === modelId);
    return model ? model.type : 'text';
  };

  const getProviderBadge = (modelId) => {
    const model = state.availableModels.find(m => m.id === modelId);
    if (!model) return null;

    const colors = {
      openai: 'bg-green-100 text-green-800',
      anthropic: 'bg-purple-100 text-purple-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        colors[model.provider] || 'bg-gray-100 text-gray-800'
      }`}>
        {model.provider.charAt(0).toUpperCase() + model.provider.slice(1)}
      </span>
    );
  };

  const getTypeBadge = (modelId) => {
    const type = getModelType(modelId);
    const isImage = type === 'image';
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        isImage ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
      }`}>
        {isImage ? (
          <>
            <Image className="w-3 h-3 mr-1" />
            Image
          </>
        ) : (
          <>
            <MessageSquare className="w-3 h-3 mr-1" />
            Text
          </>
        )}
      </span>
    );
  };

  const getModelIcon = (modelId) => {
    const type = getModelType(modelId);
    return type === 'image' ? Image : MessageSquare;
  };

  const handleRefreshModels = async () => {
    setIsRefreshing(true);
    try {
      await actions.refreshModels();
    } catch (error) {
      console.error('Failed to refresh models:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!state.availableModels.length) {
    return (
      <div className="flex items-center px-3 py-2 text-sm text-gray-500">
        <Bot className="w-4 h-4 mr-2" />
        Loading models...
      </div>
    );
  }

  const ModelIcon = getModelIcon(state.selectedModel);

  return (
    <div className="flex items-center space-x-2">
      <Listbox value={state.selectedModel} onChange={actions.setSelectedModel}>
        <div className="relative">
          <Listbox.Button className="relative w-48 cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200">
            <span className="flex items-center">
              <ModelIcon className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
              <span className="block truncate text-sm">
                {getModelDisplayName(state.selectedModel)}
              </span>
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDownIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
            </span>
          </Listbox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute right-0 z-10 mt-1 max-h-60 w-80 overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {state.availableModels.map((model) => {
                const ModelOptionIcon = model.type === 'image' ? Image : MessageSquare;
                return (
                  <Listbox.Option
                    key={model.id}
                    className={({ active }) =>
                      clsx(
                        'relative cursor-default select-none py-3 pl-3 pr-9',
                        active ? 'bg-primary-50 text-primary-900' : 'text-gray-900'
                      )
                    }
                    value={model.id}
                  >
                    {({ selected, active }) => (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <ModelOptionIcon className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                            <div>
                              <span className={clsx('block truncate font-medium', selected && 'text-primary-600')}>
                                {model.name}
                              </span>
                              <div className="mt-1 flex items-center space-x-2">
                                {getProviderBadge(model.id)}
                                {getTypeBadge(model.id)}
                              </div>
                            </div>
                          </div>

                          {selected && (
                            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary-600">
                              <CheckIcon className="h-4 w-4" aria-hidden="true" />
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </Listbox.Option>
                );
              })}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>

      <button
        onClick={handleRefreshModels}
        disabled={isRefreshing}
        className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-gray-100 transition-colors duration-200 disabled:opacity-50"
        title="Refresh available models"
      >
        <RefreshCw className={clsx('h-4 w-4', isRefreshing && 'animate-spin')} />
      </button>
    </div>
  );
};

export default ModelSelector; 