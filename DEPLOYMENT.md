# AI Chat Interface - Linux Deployment Guide

This guide covers the installation, configuration, and management of the AI Chat Interface on Linux systems.

## 🚀 Quick Installation

### Prerequisites

- Linux system (Ubuntu 18.04+, CentOS 7+, Debian 9+, Fedora 30+)
- User with sudo privileges (not root)
- Internet connection

### One-Line Installation

```bash
# Download and run the installation script
curl -fsSL https://raw.githubusercontent.com/djkiraly/embeddedAiAgent/main/install.sh | bash

# Or download first, then run
wget https://raw.githubusercontent.com/djkiraly/embeddedAiAgent/main/install.sh
chmod +x install.sh
./install.sh
```

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/djkiraly/embeddedAiAgent.git
cd embeddedAiAgent

# Make the script executable
chmod +x install.sh

# Run the installation
./install.sh
```

## 📋 What Gets Installed

The installation script automatically sets up:

- **System Dependencies**: Node.js 18, npm, git, build tools, SQLite, Nginx
- **Application**: Complete AI Chat Interface (frontend + backend)
- **Services**: Systemd services for auto-start and management
- **Database**: SQLite database with proper schema
- **Reverse Proxy**: Nginx configuration for serving the application
- **Security**: Dedicated service user, firewall rules, security headers
- **Logging**: Structured logging with rotation
- **Management**: Command-line management tools

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │    Frontend     │    │    Backend      │
│   (Port 80)     │───▶│   (Port 3000)   │───▶│   (Port 5000)   │
│  Reverse Proxy  │    │   React App     │    │   Express API   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                               ┌─────────────────┐
                                               │   SQLite DB     │
                                               │   (Database)    │
                                               └─────────────────┘
```

## ⚙️ Configuration

### API Keys Configuration

After installation, configure your API keys:

```bash
# Edit the backend environment file
sudo -u aichat nano /opt/ai-chat-interface/backend/.env

# Add your API keys:
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Restart services to apply changes
ai-chat-manager restart
```

### Environment Variables

The installation creates configuration files with the following structure:

**Backend Configuration** (`/opt/ai-chat-interface/backend/.env`):
```env
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
DATABASE_PATH=/opt/ai-chat-interface/data/database.sqlite
FRONTEND_URL=http://localhost:3000
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
LOG_LEVEL=info
LOG_FILE=/opt/ai-chat-interface/logs/backend.log
```

**Frontend Configuration** (`/opt/ai-chat-interface/frontend/.env.production`):
```env
REACT_APP_API_URL=http://localhost:5000/api
GENERATE_SOURCEMAP=false
```

### Custom Domain Configuration

To use a custom domain:

1. **Update Nginx configuration:**
   ```bash
   sudo nano /etc/nginx/sites-available/ai-chat-interface
   # Change: server_name localhost;
   # To:     server_name your-domain.com;
   ```

2. **Update CORS settings:**
   ```bash
   sudo -u aichat nano /opt/ai-chat-interface/backend/.env
   # Change: FRONTEND_URL=http://localhost:3000
   # To:     FRONTEND_URL=https://your-domain.com
   ```

3. **Restart services:**
   ```bash
   ai-chat-manager restart
   sudo systemctl restart nginx
   ```

## 🛠️ Management Commands

The installation provides a convenient management script:

### Service Management
```bash
# Start all services
ai-chat-manager start

# Stop all services
ai-chat-manager stop

# Restart all services
ai-chat-manager restart

# Check service status
ai-chat-manager status
```

### Logs and Monitoring
```bash
# View backend logs (real-time)
ai-chat-manager logs backend

# View frontend logs (real-time)
ai-chat-manager logs frontend

# View nginx logs (real-time)
ai-chat-manager logs nginx

# View systemd service logs
sudo journalctl -u ai-chat-backend -f
sudo journalctl -u ai-chat-frontend -f
```

### Application Updates
```bash
# Update application from git repository
ai-chat-manager update
```

### Direct Service Management
```bash
# Using systemctl directly
sudo systemctl status ai-chat-backend
sudo systemctl status ai-chat-frontend

sudo systemctl restart ai-chat-backend
sudo systemctl restart ai-chat-frontend
```

## 📊 Monitoring and Health Checks

### Service Status
```bash
# Check all services
ai-chat-manager status

# Expected output:
# AI Chat Interface Status:
# ========================
# Backend: active
# Frontend: active
# Nginx: active
```

### Health Endpoints
```bash
# Check backend health
curl http://localhost/api/health

# Expected response:
# {
#   "status": "OK",
#   "timestamp": "2024-01-01T00:00:00.000Z",
#   "uptime": 3600,
#   "environment": "production",
#   "version": "1.0.0"
# }
```

### Log Locations
- Application logs: `/opt/ai-chat-interface/logs/`
- System logs: `journalctl -u ai-chat-backend` / `journalctl -u ai-chat-frontend`
- Nginx logs: `/opt/ai-chat-interface/logs/nginx-*.log`

## 🔒 Security

### Service User
- Dedicated system user: `aichat`
- No shell login capability
- Restricted file permissions
- Isolated from other system processes

### Systemd Security Features
- `NoNewPrivileges=yes`
- `ProtectSystem=strict`
- `ProtectHome=yes`
- Restricted file system access

### Firewall Configuration
The installer automatically configures:
- Port 22 (SSH)
- Port 80 (HTTP)
- Port 443 (HTTPS)

### SSL/TLS Setup (Optional)

For HTTPS support with Let's Encrypt:

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx  # Ubuntu/Debian
sudo dnf install certbot python3-certbot-nginx      # Fedora

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is handled by certbot
sudo systemctl enable certbot.timer
```

## 🗃️ Database Management

### Database Location
- SQLite database: `/opt/ai-chat-interface/data/database.sqlite`

### Database Operations
```bash
# Access database directly
sudo -u aichat sqlite3 /opt/ai-chat-interface/data/database.sqlite

# Create backup
sudo -u aichat cp /opt/ai-chat-interface/data/database.sqlite \
                  /opt/ai-chat-interface/data/backup-$(date +%Y%m%d).sqlite

# View tables
sudo -u aichat sqlite3 /opt/ai-chat-interface/data/database.sqlite ".tables"

# Export data
sudo -u aichat sqlite3 /opt/ai-chat-interface/data/database.sqlite ".dump" > backup.sql
```

## 🚨 Troubleshooting

### Common Issues

#### Services Won't Start
```bash
# Check service status
systemctl status ai-chat-backend
systemctl status ai-chat-frontend

# Check logs for errors
journalctl -u ai-chat-backend --no-pager
journalctl -u ai-chat-frontend --no-pager

# Common fixes:
# 1. Check API keys are configured
# 2. Verify database permissions
# 3. Ensure ports aren't in use
```

#### Port Already in Use
```bash
# Find what's using the ports
sudo lsof -i :3000
sudo lsof -i :5000
sudo lsof -i :80

# Kill conflicting processes
sudo kill -9 <PID>

# Restart services
ai-chat-manager restart
```

#### Permission Issues
```bash
# Fix ownership
sudo chown -R aichat:aichat /opt/ai-chat-interface

# Fix permissions
sudo chmod -R 755 /opt/ai-chat-interface
sudo chmod -R 644 /opt/ai-chat-interface/data/
sudo chmod 755 /opt/ai-chat-interface/data/
```

#### Database Issues
```bash
# Recreate database
sudo -u aichat rm /opt/ai-chat-interface/data/database.sqlite
sudo -u aichat node /opt/ai-chat-interface/backend/scripts/initDatabase.js
ai-chat-manager restart
```

#### Nginx Configuration Issues
```bash
# Test nginx configuration
sudo nginx -t

# Check nginx status
sudo systemctl status nginx

# View nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Performance Tuning

#### For High Traffic
```bash
# Increase worker processes in nginx
sudo nano /etc/nginx/nginx.conf
# worker_processes auto;
# worker_connections 1024;

# Increase Node.js memory limit
sudo nano /etc/systemd/system/ai-chat-backend.service
# Environment=NODE_OPTIONS="--max-old-space-size=2048"

sudo systemctl daemon-reload
ai-chat-manager restart
```

#### Database Optimization
```bash
# Vacuum database periodically
sudo -u aichat sqlite3 /opt/ai-chat-interface/data/database.sqlite "VACUUM;"

# Set up automatic vacuum
echo "PRAGMA auto_vacuum = INCREMENTAL;" | \
sudo -u aichat sqlite3 /opt/ai-chat-interface/data/database.sqlite
```

## 📈 Scaling and High Availability

### Load Balancing
For multiple instances, use a load balancer like HAProxy:

```bash
# Install HAProxy
sudo apt-get install haproxy

# Configure for multiple backend instances
# /etc/haproxy/haproxy.cfg
```

### Process Management
Consider using PM2 for advanced process management:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create PM2 configuration
# Replace systemd services with PM2
```

## 🗑️ Uninstallation

To completely remove the application:

```bash
# Download and run uninstall script
curl -fsSL https://raw.githubusercontent.com/djkiraly/embeddedAiAgent/main/uninstall.sh | bash

# Or run manually
chmod +x uninstall.sh
./uninstall.sh
```

The uninstaller will:
- Stop and remove all services
- Remove application files
- Remove service user
- Remove nginx configuration
- Create database backup
- Clean up log rotation

## 📞 Support

### Log Analysis
When reporting issues, include:
```bash
# System information
uname -a
cat /etc/os-release

# Service status
ai-chat-manager status

# Recent logs
journalctl -u ai-chat-backend --since "1 hour ago" --no-pager
journalctl -u ai-chat-frontend --since "1 hour ago" --no-pager
```

### Getting Help
1. Check the troubleshooting section above
2. Review application logs
3. Check GitHub issues
4. Create a new issue with complete log output

---

## 📄 License

This deployment guide is part of the AI Chat Interface project. See the main README.md for license information.