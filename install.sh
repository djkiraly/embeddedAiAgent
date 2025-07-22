#!/bin/bash

# AI Chat Interface - Linux Installation Script
# This script installs and configures the AI Chat application on Linux

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="ai-chat-interface"
APP_DIR="/opt/${APP_NAME}"
SERVICE_USER="aichat"
FRONTEND_PORT=3000
BACKEND_PORT=5000
NODE_VERSION="18"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root for security reasons."
        print_status "Please run as a regular user with sudo privileges."
        exit 1
    fi
}

# Function to check if user has sudo privileges
check_sudo() {
    if ! sudo -n true 2>/dev/null; then
        print_error "This script requires sudo privileges."
        print_status "Please ensure your user is in the sudo group."
        exit 1
    fi
}

# Function to detect Linux distribution
detect_distro() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        DISTRO=$ID
        VERSION=$VERSION_ID
    else
        print_error "Cannot detect Linux distribution"
        exit 1
    fi
    print_status "Detected: $PRETTY_NAME"
}

# Function to install Node.js
install_nodejs() {
    print_status "Installing Node.js ${NODE_VERSION}..."
    
    # Install NodeSource repository
    if command -v node >/dev/null 2>&1; then
        NODE_CURRENT=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ $NODE_CURRENT -ge $NODE_VERSION ]]; then
            print_success "Node.js ${NODE_CURRENT} is already installed"
            return 0
        fi
    fi

    case $DISTRO in
        ubuntu|debian)
            curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
            sudo apt-get install -y nodejs
            ;;
        centos|rhel|fedora)
            curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | sudo bash -
            sudo dnf install -y nodejs npm || sudo yum install -y nodejs npm
            ;;
        *)
            print_error "Unsupported distribution: $DISTRO"
            print_status "Please install Node.js ${NODE_VERSION} manually"
            exit 1
            ;;
    esac
    
    print_success "Node.js installed: $(node --version)"
    print_success "npm installed: $(npm --version)"
}

# Function to install system dependencies
install_system_deps() {
    print_status "Installing system dependencies..."
    
    case $DISTRO in
        ubuntu|debian)
            sudo apt-get update
            sudo apt-get install -y curl wget git build-essential python3 sqlite3 nginx
            ;;
        centos|rhel|fedora)
            sudo dnf update -y || sudo yum update -y
            sudo dnf install -y curl wget git gcc-c++ make python3 sqlite nginx || \
            sudo yum install -y curl wget git gcc-c++ make python3 sqlite nginx
            ;;
        *)
            print_warning "Unknown distribution, skipping system dependencies"
            ;;
    esac
}

# Function to create service user
create_service_user() {
    print_status "Creating service user: ${SERVICE_USER}"
    
    if id "$SERVICE_USER" &>/dev/null; then
        print_success "User ${SERVICE_USER} already exists"
    else
        sudo useradd --system --shell /bin/bash --home-dir /home/${SERVICE_USER} \
                    --create-home --comment "AI Chat Service User" ${SERVICE_USER}
        print_success "Created user: ${SERVICE_USER}"
    fi
}

# Function to setup application directory
setup_app_directory() {
    print_status "Setting up application directory: ${APP_DIR}"
    
    # Create directory structure
    sudo mkdir -p ${APP_DIR}
    sudo mkdir -p ${APP_DIR}/logs
    sudo mkdir -p ${APP_DIR}/data
    
    # Debug: Check what files exist in current directory
    print_status "Checking current directory contents..."
    if [[ -f "package.json" ]]; then
        print_status "Found package.json in current directory"
    else
        print_status "No package.json in current directory"
    fi
    
    if [[ -d "backend" ]]; then
        print_status "Found backend directory"
    else
        print_status "No backend directory found"
    fi
    
    if [[ -d "frontend" ]]; then
        print_status "Found frontend directory"
    else
        print_status "No frontend directory found"
    fi
    
    # Always clone the repository to ensure we have all files
    print_status "Cloning application from repository..."
    TEMP_DIR=$(mktemp -d)
    if cd ${TEMP_DIR} && git clone https://github.com/djkiraly/embeddedAiAgent.git .; then
        print_status "Copying cloned files to ${APP_DIR}..."
        sudo cp -r . ${APP_DIR}/
        cd - > /dev/null
        rm -rf ${TEMP_DIR}
        
        # Verify files were copied
        if [[ -f "${APP_DIR}/package.json" ]]; then
            print_success "Repository cloned and files copied successfully"
        else
            print_error "Files were not copied correctly"
            return 1
        fi
    else
        print_error "Failed to clone repository"
        rm -rf ${TEMP_DIR}
        return 1
    fi
    
    # Set ownership
    sudo chown -R ${SERVICE_USER}:${SERVICE_USER} ${APP_DIR}
    
    print_success "Application directory setup complete"
}

# Function to install application dependencies
install_app_deps() {
    print_status "Installing application dependencies..."
    
    # Switch to service user and install dependencies
    sudo -u ${SERVICE_USER} bash << EOF
        cd ${APP_DIR}
        
        # Install all dependencies using the project's convenience script
        npm run install:all
        
        # Build frontend for production
        npm run build
EOF
    
    print_success "Application dependencies installed"
}

# Function to create environment configuration
create_env_config() {
    print_status "Creating environment configuration..."
    
    # Create backend .env file
    sudo -u ${SERVICE_USER} tee ${APP_DIR}/backend/.env > /dev/null << EOF
# Environment
NODE_ENV=production

# Server Configuration
PORT=${BACKEND_PORT}
HOST=0.0.0.0

# Database
DATABASE_PATH=${APP_DIR}/data/database.sqlite

# CORS Origins
FRONTEND_URL=http://localhost:${FRONTEND_PORT}

# API Keys (Configure these after installation)
# OPENAI_API_KEY=your_openai_api_key_here
# ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Logging
LOG_LEVEL=info
LOG_FILE=${APP_DIR}/logs/backend.log
EOF

    # Create frontend .env file
    sudo -u ${SERVICE_USER} tee ${APP_DIR}/frontend/.env.production > /dev/null << EOF
# API Configuration
REACT_APP_API_URL=http://localhost:${BACKEND_PORT}/api

# Build Configuration
GENERATE_SOURCEMAP=false
EOF
    
    print_success "Environment configuration created"
    print_warning "Remember to configure your API keys in ${APP_DIR}/backend/.env"
}

# Function to create systemd services
create_systemd_services() {
    print_status "Creating systemd services..."
    
    # Backend service
    sudo tee /etc/systemd/system/ai-chat-backend.service > /dev/null << EOF
[Unit]
Description=AI Chat Interface Backend
After=network.target

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${APP_DIR}/backend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
StandardOutput=append:${APP_DIR}/logs/backend.log
StandardError=append:${APP_DIR}/logs/backend-error.log

# Security settings
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=${APP_DIR}

[Install]
WantedBy=multi-user.target
EOF

    # Frontend service (using serve to serve the built React app)
    sudo npm install -g serve
    
    sudo tee /etc/systemd/system/ai-chat-frontend.service > /dev/null << EOF
[Unit]
Description=AI Chat Interface Frontend
After=network.target

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${APP_DIR}/frontend
ExecStart=/usr/bin/npx serve -s build -l ${FRONTEND_PORT}
Restart=always
RestartSec=10
Environment=NODE_ENV=production
StandardOutput=append:${APP_DIR}/logs/frontend.log
StandardError=append:${APP_DIR}/logs/frontend-error.log

# Security settings
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=${APP_DIR}

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd
    sudo systemctl daemon-reload
    
    # Enable services
    sudo systemctl enable ai-chat-backend.service
    sudo systemctl enable ai-chat-frontend.service
    
    print_success "Systemd services created and enabled"
}

# Function to setup nginx reverse proxy
setup_nginx() {
    print_status "Setting up Nginx reverse proxy..."
    
    # Create nginx configuration
    sudo tee /etc/nginx/sites-available/ai-chat-interface > /dev/null << EOF
server {
    listen 80;
    server_name localhost;
    
    # Frontend
    location / {
        proxy_pass http://localhost:${FRONTEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Logs
    access_log ${APP_DIR}/logs/nginx-access.log;
    error_log ${APP_DIR}/logs/nginx-error.log;
}
EOF
    
    # Enable site
    if [[ -d /etc/nginx/sites-enabled ]]; then
        sudo ln -sf /etc/nginx/sites-available/ai-chat-interface /etc/nginx/sites-enabled/
        # Remove default site
        sudo rm -f /etc/nginx/sites-enabled/default
    else
        # For CentOS/RHEL/Fedora
        sudo ln -sf /etc/nginx/sites-available/ai-chat-interface /etc/nginx/conf.d/ai-chat-interface.conf
    fi
    
    # Test nginx configuration
    if sudo nginx -t; then
        sudo systemctl enable nginx
        sudo systemctl restart nginx
        print_success "Nginx configured and started"
    else
        print_error "Nginx configuration test failed"
        return 1
    fi
}

# Function to setup log rotation
setup_logrotate() {
    print_status "Setting up log rotation..."
    
    sudo tee /etc/logrotate.d/ai-chat-interface > /dev/null << EOF
${APP_DIR}/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 ${SERVICE_USER} ${SERVICE_USER}
    postrotate
        systemctl reload ai-chat-backend || true
        systemctl reload ai-chat-frontend || true
    endscript
}
EOF
    
    print_success "Log rotation configured"
}

# Function to create management script
create_management_script() {
    print_status "Creating management script..."
    
    sudo tee /usr/local/bin/ai-chat-manager > /dev/null << 'EOF'
#!/bin/bash

# AI Chat Interface Management Script

SERVICE_USER="aichat"
APP_DIR="/opt/ai-chat-interface"

case "$1" in
    start)
        echo "Starting AI Chat Interface..."
        sudo systemctl start ai-chat-backend
        sudo systemctl start ai-chat-frontend
        sudo systemctl start nginx
        echo "Services started"
        ;;
    stop)
        echo "Stopping AI Chat Interface..."
        sudo systemctl stop ai-chat-backend
        sudo systemctl stop ai-chat-frontend
        echo "Services stopped"
        ;;
    restart)
        echo "Restarting AI Chat Interface..."
        sudo systemctl restart ai-chat-backend
        sudo systemctl restart ai-chat-frontend
        sudo systemctl restart nginx
        echo "Services restarted"
        ;;
    status)
        echo "AI Chat Interface Status:"
        echo "========================"
        echo -n "Backend: "
        sudo systemctl is-active ai-chat-backend
        echo -n "Frontend: "
        sudo systemctl is-active ai-chat-frontend
        echo -n "Nginx: "
        sudo systemctl is-active nginx
        ;;
    logs)
        case "$2" in
            backend)
                sudo journalctl -u ai-chat-backend -f
                ;;
            frontend)
                sudo journalctl -u ai-chat-frontend -f
                ;;
            nginx)
                sudo tail -f ${APP_DIR}/logs/nginx-*.log
                ;;
            *)
                echo "Usage: $0 logs {backend|frontend|nginx}"
                ;;
        esac
        ;;
    update)
        echo "Updating application..."
        cd ${APP_DIR}
        sudo -u ${SERVICE_USER} git pull
        sudo -u ${SERVICE_USER} npm run install:all
        sudo -u ${SERVICE_USER} npm run build
        sudo systemctl restart ai-chat-backend
        sudo systemctl restart ai-chat-frontend
        echo "Application updated"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|update}"
        echo ""
        echo "Commands:"
        echo "  start    - Start all services"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  status   - Show service status"
        echo "  logs     - View logs (backend|frontend|nginx)"
        echo "  update   - Update application from git"
        exit 1
        ;;
esac
EOF
    
    sudo chmod +x /usr/local/bin/ai-chat-manager
    print_success "Management script created: /usr/local/bin/ai-chat-manager"
}

# Function to setup firewall
setup_firewall() {
    print_status "Configuring firewall..."
    
    if command -v ufw >/dev/null 2>&1; then
        sudo ufw allow 22/tcp    # SSH
        sudo ufw allow 80/tcp    # HTTP
        sudo ufw allow 443/tcp   # HTTPS
        print_success "UFW firewall configured"
    elif command -v firewall-cmd >/dev/null 2>&1; then
        sudo firewall-cmd --permanent --add-service=ssh
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --reload
        print_success "Firewalld configured"
    else
        print_warning "No firewall detected. Consider configuring iptables manually."
    fi
}

# Function to start services
start_services() {
    print_status "Starting services..."
    
    # Initialize database
    sudo -u ${SERVICE_USER} bash << EOF
        cd ${APP_DIR}/backend
        node scripts/initDatabase.js
EOF
    
    # Start services
    sudo systemctl start ai-chat-backend
    sleep 5
    sudo systemctl start ai-chat-frontend
    
    # Check if services started successfully
    if sudo systemctl is-active --quiet ai-chat-backend && \
       sudo systemctl is-active --quiet ai-chat-frontend; then
        print_success "All services started successfully"
    else
        print_error "Some services failed to start"
        print_status "Check logs with: ai-chat-manager logs backend"
        return 1
    fi
}

# Function to print installation summary
print_summary() {
    print_success "==================================="
    print_success "AI Chat Interface Installation Complete!"
    print_success "==================================="
    echo ""
    print_status "Application URL: http://localhost (or your server IP)"
    print_status "Backend API: http://localhost/api"
    print_status "Application Directory: ${APP_DIR}"
    print_status "Service User: ${SERVICE_USER}"
    echo ""
    print_status "Management Commands:"
    echo "  ai-chat-manager start     - Start services"
    echo "  ai-chat-manager stop      - Stop services"
    echo "  ai-chat-manager restart   - Restart services"
    echo "  ai-chat-manager status    - Check status"
    echo "  ai-chat-manager logs      - View logs"
    echo "  ai-chat-manager update    - Update application"
    echo ""
    print_warning "IMPORTANT: Configure your API keys in ${APP_DIR}/backend/.env"
    echo ""
    print_status "To configure API keys:"
    echo "  sudo -u ${SERVICE_USER} nano ${APP_DIR}/backend/.env"
    echo "  ai-chat-manager restart"
    echo ""
    print_success "Installation completed successfully!"
}

# Main installation function
main() {
    print_status "Starting AI Chat Interface installation..."
    
    check_root
    check_sudo
    detect_distro
    
    install_system_deps
    install_nodejs
    create_service_user
    setup_app_directory
    install_app_deps
    create_env_config
    create_systemd_services
    setup_nginx
    setup_logrotate
    create_management_script
    setup_firewall
    start_services
    
    print_summary
}

# Run installation
main "$@" 