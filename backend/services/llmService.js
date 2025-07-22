const axios = require('axios');
require('dotenv').config();

class LLMService {
  constructor() {
    this.providers = {
      'gpt-3.5-turbo': {
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-3.5-turbo',
        type: 'text'
      },
      'gpt-4': {
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4',
        type: 'text'
      },
      'gpt-4-turbo-preview': {
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4-turbo-preview',
        type: 'text'
      },
      'dall-e-3': {
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1/images/generations',
        model: 'dall-e-3',
        type: 'image'
      },
      'dall-e-2': {
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1/images/generations',
        model: 'dall-e-2',
        type: 'image'
      },
      'claude-3-sonnet': {
        provider: 'anthropic',
        endpoint: 'https://api.anthropic.com/v1/messages',
        model: 'claude-3-sonnet-20240229',
        type: 'text'
      },
      'claude-3-opus': {
        provider: 'anthropic',
        endpoint: 'https://api.anthropic.com/v1/messages',
        model: 'claude-3-opus-20240229',
        type: 'text'
      },
      'claude-3-haiku': {
        provider: 'anthropic',
        endpoint: 'https://api.anthropic.com/v1/messages',
        model: 'claude-3-haiku-20240307',
        type: 'text'
      }
    };
  }

  async sendMessage(model, messages, apiKeys, settings = {}) {
    const providerConfig = this.providers[model];
    if (!providerConfig) {
      throw new Error(`Unsupported model: ${model}`);
    }

    const { provider, endpoint, type } = providerConfig;
    
    // Handle image generation separately
    if (type === 'image') {
      // For image generation, we expect the last message to be the prompt
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || lastMessage.role !== 'user') {
        throw new Error('Image generation requires a user prompt');
      }
      return this.generateImage(model, lastMessage.content, apiKeys.openai, settings);
    }
    
    if (provider === 'openai') {
      return this.callOpenAI(endpoint, providerConfig.model, messages, apiKeys.openai, settings);
    } else if (provider === 'anthropic') {
      return this.callAnthropic(endpoint, providerConfig.model, messages, apiKeys.anthropic, settings);
    }
    
    throw new Error(`Unsupported provider: ${provider}`);
  }

  async generateImage(model, prompt, apiKey, settings = {}) {
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const modelConfig = this.providers[model];
    if (!modelConfig || modelConfig.type !== 'image') {
      throw new Error(`Invalid image model: ${model}`);
    }

    // DALL-E specific settings
    const payload = {
      model: modelConfig.model,
      prompt: prompt,
      n: 1, // Number of images to generate
      size: settings.image_size || (model === 'dall-e-3' ? '1024x1024' : '512x512'),
      quality: model === 'dall-e-3' ? (settings.image_quality || 'standard') : undefined,
      style: model === 'dall-e-3' ? (settings.image_style || 'natural') : undefined
    };

    // Remove undefined values
    Object.keys(payload).forEach(key => 
      payload[key] === undefined && delete payload[key]
    );

    try {
      const response = await axios.post(modelConfig.endpoint, payload, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // Increased timeout for image generation
      });

      const imageData = response.data.data[0];
      
      return {
        content: imageData.url,
        type: 'image',
        model: model,
        prompt: prompt,
        revised_prompt: imageData.revised_prompt, // DALL-E 3 provides this
        provider: 'openai'
      };
    } catch (error) {
      console.error('OpenAI Image Generation Error:', error.response?.data || error.message);
      throw new Error(`Image generation failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async callOpenAI(endpoint, model, messages, apiKey, settings) {
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const payload = {
      model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      max_tokens: parseInt(settings.max_tokens) || 2000,
      temperature: parseFloat(settings.temperature) || 0.7
    };

    try {
      const response = await axios.post(endpoint, payload, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      const completion = response.data.choices[0].message;
      return {
        content: completion.content,
        type: 'text',
        model: model,
        usage: response.data.usage,
        provider: 'openai'
      };
    } catch (error) {
      console.error('OpenAI API Error:', error.response?.data || error.message);
      throw new Error(`OpenAI API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async callAnthropic(endpoint, model, messages, apiKey, settings) {
    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    // Convert messages for Anthropic format
    const systemMessage = messages.find(msg => msg.role === 'system');
    const conversationMessages = messages.filter(msg => msg.role !== 'system');

    const payload = {
      model,
      max_tokens: parseInt(settings.max_tokens) || 1024,
      temperature: parseFloat(settings.temperature) || 0.7,
      messages: conversationMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }))
    };

    if (systemMessage) {
      payload.system = systemMessage.content;
    }

    try {
      const response = await axios.post(endpoint, payload, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        timeout: 30000
      });

      return {
        content: response.data.content[0].text,
        type: 'text',
        model: model,
        usage: response.data.usage,
        provider: 'anthropic'
      };
    } catch (error) {
      console.error('Anthropic API Error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.error?.type || error.message;
      throw new Error(`Anthropic API Error: ${errorMessage}`);
    }
  }

  getAvailableModels() {
    return Object.keys(this.providers).map(key => ({
      id: key,
      name: this.formatModelName(key),
      provider: this.providers[key].provider,
      type: this.providers[key].type
    }));
  }

  formatModelName(modelId) {
    const nameMap = {
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'gpt-4': 'GPT-4',
      'gpt-4-turbo-preview': 'GPT-4 Turbo',
      'dall-e-3': 'DALL-E 3',
      'dall-e-2': 'DALL-E 2',
      'claude-3-sonnet': 'Claude 3 Sonnet',
      'claude-3-opus': 'Claude 3 Opus',
      'claude-3-haiku': 'Claude 3 Haiku'
    };
    return nameMap[modelId] || modelId;
  }

  validateModel(model) {
    return Object.keys(this.providers).includes(model);
  }

  getModelType(model) {
    const config = this.providers[model];
    return config ? config.type : null;
  }

  isImageModel(model) {
    return this.getModelType(model) === 'image';
  }
}

module.exports = LLMService; 