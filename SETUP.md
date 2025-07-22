# AI Chat Interface - Setup Instructions

## 🚀 Quick Start

This full-stack application provides an AI chat interface with support for multiple Large Language Models (OpenAI, Anthropic, etc.).

### Prerequisites

- Node.js 18+ installed
- npm package manager
- API keys for desired LLM providers (OpenAI, Anthropic)

### Installation

1. **Install Dependencies**
   ```bash
   npm run install:all
   ```
   This installs dependencies for both frontend and backend.

2. **Environment Setup**
   ```bash
   # Navigate to backend directory
   cd backend
   
   # Copy environment template (optional - will use defaults)
   cp .env.example .env
   
   # Edit .env file to add your API keys (optional - can set in UI)
   # OPENAI_API_KEY=sk-...
   # ANTHROPIC_API_KEY=sk-ant-...
   ```

3. **Initialize Database**
   ```bash
   npm run backend:dev
   ```
   The database will be automatically created on first run.

### Running the Application

#### Development Mode
```bash
# From project root - starts both backend and frontend
npm start
```

This will start:
- Backend API server on `http://localhost:5000`
- Frontend React app on `http://localhost:3000`

#### Alternative Start Methods
```bash
# Run services in detached mode
npm run start:detached

# Stop all services
npm run stop

# Run services separately
npm run backend:dev    # Backend only
npm run frontend:dev   # Frontend only
```

### Configuration

1. **Open the application** at `http://localhost:3000`

2. **Configure API Keys**:
   - Click the Settings icon in the sidebar
   - Navigate to "Models & API Keys" tab
   - Enter your API keys for OpenAI and/or Anthropic
   - Test the keys using the "Test" button
   - Save changes

3. **Set Preferences**:
   - Configure default model
   - Adjust temperature and token limits
   - Enable/disable conversation logging

### Features

#### ✨ Frontend Features
- **Real-time Chat Interface**: Beautiful, responsive chat UI
- **Multi-LLM Support**: Switch between different AI models instantly
- **Conversation History**: Browse and continue previous conversations
- **Markdown Support**: Rich text rendering with code syntax highlighting
- **Mobile Responsive**: Works perfectly on all device sizes
- **Settings Management**: Configure API keys and preferences
- **Usage Analytics**: Detailed reports on model usage and conversations

#### 🔧 Backend Features
- **RESTful API**: Clean, well-documented API endpoints
- **SQLite Database**: Lightweight, embedded database for data persistence
- **Session Management**: Track and organize conversations
- **Usage Tracking**: Monitor token usage and model performance
- **Rate Limiting**: Built-in protection against API abuse
- **Error Handling**: Comprehensive error handling and logging
- **Data Export**: Export conversation data in JSON format

#### 📊 Analytics & Reporting
- **Usage Statistics**: Track messages, sessions, and token consumption
- **Model Comparison**: Compare performance across different AI models
- **Session Analytics**: Detailed conversation metrics
- **Export Functionality**: Download your data for external analysis

### API Endpoints

The backend exposes several API endpoints:

#### Chat Endpoints
- `POST /api/chat` - Send message to AI
- `GET /api/models` - Get available models
- `GET /api/sessions` - Get chat sessions
- `GET /api/sessions/:id` - Get specific session
- `DELETE /api/sessions/:id` - Delete session

#### Settings Endpoints
- `GET /api/settings` - Get current settings
- `PUT /api/settings` - Update settings
- `POST /api/settings/test-api-key` - Test API key validity

#### Reporting Endpoints
- `GET /api/report` - Get usage analytics
- `GET /api/report/export` - Export conversation data

### Database Schema

The application uses SQLite with the following tables:

- **sessions**: Chat session metadata
- **messages**: Individual chat messages
- **settings**: Application configuration
- **api_keys**: Encrypted API key storage

### Security Features

- **API Key Encryption**: Keys are hashed before storage
- **Rate Limiting**: Protects against API abuse
- **Input Validation**: Comprehensive input sanitization
- **Error Boundaries**: Graceful error handling in UI
- **CORS Protection**: Configured for secure cross-origin requests

### Troubleshooting

#### Common Issues

1. **Backend won't start**:
   - Check if port 5000 is available
   - Verify Node.js version (18+ required)
   - Check database permissions

2. **Frontend won't start**:
   - Check if port 3000 is available
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall

3. **API Keys not working**:
   - Verify key format and validity
   - Use the "Test" button in settings
   - Check API provider documentation

4. **Database issues**:
   - Delete `backend/database.sqlite` to reset
   - Restart backend to recreate tables

#### Health Check

Visit `http://localhost:5000/health` to check backend status.

### Architecture

```
ai-chat-app/
├── frontend/          # React application
│   ├── public/       # Static assets
│   └── src/         # Source code
│       ├── components/   # React components
│       ├── context/     # State management
│       ├── services/    # API services
│       └── utils/      # Utility functions
├── backend/          # Node.js + Express API
│   ├── config/      # Database configuration
│   ├── models/      # Data models
│   ├── routes/      # API routes
│   ├── services/    # Business logic
│   └── scripts/     # Utility scripts
└── package.json     # Root package management
```

### Future Enhancements

The application is designed for extensibility:

- **User Authentication**: Add user accounts and permissions
- **Multiple Agents**: Support for different AI personalities
- **Advanced Analytics**: More detailed usage metrics
- **Plugin System**: Extend functionality with plugins
- **Cloud Deployment**: Ready for production deployment
- **Database Migration**: Easy upgrade to PostgreSQL

### Support

For issues and questions:
1. Check the application logs in the browser console
2. Verify backend logs in the terminal
3. Review the API documentation at `http://localhost:5000/api`

---

**Enjoy your AI Chat Interface! 🤖💬** 