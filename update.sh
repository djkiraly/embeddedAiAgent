#!/bin/bash

# AI Chat Interface - Update Script
# This script updates the deployed AI Chat application

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

# Function to check if user has sudo privileges
check_sudo() {
    if ! sudo -n true 2>/dev/null; then
        print_error "This script requires sudo privileges."
        print_status "Please ensure your user is in the sudo group."
        exit 1
    fi
}

# Function to check if application is installed
check_installation() {
    if [[ ! -d "${APP_DIR}" ]]; then
        print_error "AI Chat Interface is not installed in ${APP_DIR}"
        print_status "Please run the installation script first."
        exit 1
    fi
    
    if ! id "${SERVICE_USER}" &>/dev/null; then
        print_error "Service user ${SERVICE_USER} not found"
        print_status "The installation may be corrupted."
        exit 1
    fi
}

# Function to create backup
create_backup() {
    print_status "Creating backup..."
    
    BACKUP_DIR="/tmp/ai-chat-backup-$(date +%Y%m%d-%H%M%S)"
    sudo mkdir -p "${BACKUP_DIR}"
    
    # Backup database
    if [[ -f "${APP_DIR}/data/database.sqlite" ]]; then
        sudo cp "${APP_DIR}/data/database.sqlite" "${BACKUP_DIR}/"
        print_status "Database backed up to: ${BACKUP_DIR}/database.sqlite"
    fi
    
    # Backup configuration files
    sudo cp "${APP_DIR}/backend/.env" "${BACKUP_DIR}/" 2>/dev/null || true
    sudo cp "${APP_DIR}/frontend/.env.production" "${BACKUP_DIR}/" 2>/dev/null || true
    
    print_success "Backup created: ${BACKUP_DIR}"
    echo "${BACKUP_DIR}" > /tmp/ai-chat-last-backup
}

# Function to stop services
stop_services() {
    print_status "Stopping services..."
    
    sudo systemctl stop ai-chat-frontend || true
    sudo systemctl stop ai-chat-backend || true
    
    print_success "Services stopped"
}

# Function to update application code
update_code() {
    print_status "Updating application code..."
    
    # Check if it's a git repository
    if [[ -d "${APP_DIR}/.git" ]]; then
        # Git update
        sudo -u ${SERVICE_USER} bash -c "
            cd ${APP_DIR}
            git fetch origin
            git reset --hard origin/main
        "
        print_success "Code updated from git repository"
    else
        print_warning "Not a git repository. Manual code update required."
        print_status "To update manually:"
        echo "  1. Download new version"
        echo "  2. Copy files to ${APP_DIR}"
        echo "  3. Set ownership: sudo chown -R ${SERVICE_USER}:${SERVICE_USER} ${APP_DIR}"
        read -p "Press Enter to continue with dependency updates..."
    fi
}

# Function to update dependencies
update_dependencies() {
    print_status "Updating dependencies..."
    
    sudo -u ${SERVICE_USER} bash << 'EOF'
        cd /opt/ai-chat-interface
        
        # Update root dependencies if package.json exists
        if [[ -f "package.json" ]]; then
            echo "Updating root dependencies..."
            npm install --production
        fi
        
        # Update backend dependencies
        cd backend
        echo "Updating backend dependencies..."
        npm install --production
        
        # Update frontend dependencies and rebuild
        cd ../frontend
        echo "Updating frontend dependencies..."
        npm install --production
        
        echo "Building frontend for production..."
        npm run build
EOF
    
    print_success "Dependencies updated"
}

# Function to run database migrations (if any)
run_migrations() {
    print_status "Running database migrations..."
    
    # Check if there's a migrations script
    if [[ -f "${APP_DIR}/backend/scripts/migrate.js" ]]; then
        sudo -u ${SERVICE_USER} bash -c "
            cd ${APP_DIR}/backend
            node scripts/migrate.js
        "
        print_success "Database migrations completed"
    else
        print_status "No migration script found, skipping"
    fi
}

# Function to update configuration
update_config() {
    print_status "Checking configuration..."
    
    # Check if new configuration options are needed
    BACKUP_FILE=$(cat /tmp/ai-chat-last-backup 2>/dev/null || echo "")
    
    if [[ -f "${BACKUP_FILE}/backend/.env" ]]; then
        print_status "Comparing configuration files..."
        
        # Create a temporary merged config
        TEMP_ENV="/tmp/merged.env"
        sudo cp "${APP_DIR}/backend/.env" "${TEMP_ENV}"
        
        # Restore API keys and custom settings
        if grep -q "OPENAI_API_KEY=" "${BACKUP_FILE}/backend/.env" 2>/dev/null; then
            OPENAI_KEY=$(grep "OPENAI_API_KEY=" "${BACKUP_FILE}/backend/.env" | head -1)
            sudo sed -i "/^OPENAI_API_KEY=/d" "${TEMP_ENV}"
            echo "${OPENAI_KEY}" | sudo tee -a "${TEMP_ENV}" >/dev/null
        fi
        
        if grep -q "ANTHROPIC_API_KEY=" "${BACKUP_FILE}/backend/.env" 2>/dev/null; then
            ANTHROPIC_KEY=$(grep "ANTHROPIC_API_KEY=" "${BACKUP_FILE}/backend/.env" | head -1)
            sudo sed -i "/^ANTHROPIC_API_KEY=/d" "${TEMP_ENV}"
            echo "${ANTHROPIC_KEY}" | sudo tee -a "${TEMP_ENV}" >/dev/null
        fi
        
        # Replace the config file
        sudo mv "${TEMP_ENV}" "${APP_DIR}/backend/.env"
        sudo chown ${SERVICE_USER}:${SERVICE_USER} "${APP_DIR}/backend/.env"
        
        print_success "Configuration updated with preserved settings"
    else
        print_warning "No backup configuration found"
    fi
}

# Function to start services
start_services() {
    print_status "Starting services..."
    
    # Start backend first
    sudo systemctl start ai-chat-backend
    sleep 5
    
    # Check if backend started successfully
    if ! sudo systemctl is-active --quiet ai-chat-backend; then
        print_error "Backend failed to start"
        print_status "Check logs: journalctl -u ai-chat-backend --no-pager"
        return 1
    fi
    
    # Start frontend
    sudo systemctl start ai-chat-frontend
    sleep 3
    
    # Check if frontend started successfully
    if ! sudo systemctl is-active --quiet ai-chat-frontend; then
        print_error "Frontend failed to start"
        print_status "Check logs: journalctl -u ai-chat-frontend --no-pager"
        return 1
    fi
    
    print_success "Services started successfully"
}

# Function to verify update
verify_update() {
    print_status "Verifying update..."
    
    # Check service status
    if sudo systemctl is-active --quiet ai-chat-backend && \
       sudo systemctl is-active --quiet ai-chat-frontend; then
        print_success "All services are running"
    else
        print_error "Some services are not running"
        return 1
    fi
    
    # Check health endpoint
    sleep 10  # Wait for services to fully start
    
    if curl -s http://localhost/api/health >/dev/null 2>&1; then
        print_success "Health check passed"
    else
        print_warning "Health check failed - services may still be starting"
    fi
    
    # Show version info if available
    if curl -s http://localhost/api/health | grep -q version 2>/dev/null; then
        VERSION=$(curl -s http://localhost/api/health | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
        print_status "Current version: ${VERSION}"
    fi
}

# Function to cleanup
cleanup() {
    print_status "Cleaning up temporary files..."
    
    # Clean npm cache
    sudo -u ${SERVICE_USER} npm cache clean --force 2>/dev/null || true
    
    # Remove old log files (keep last 7 days)
    sudo find ${APP_DIR}/logs/ -name "*.log.*" -mtime +7 -delete 2>/dev/null || true
    
    print_success "Cleanup completed"
}

# Function to print update summary
print_update_summary() {
    print_success "==================================="
    print_success "AI Chat Interface Update Complete!"
    print_success "==================================="
    echo ""
    
    if curl -s http://localhost/api/health >/dev/null 2>&1; then
        print_status "✅ Application is accessible at: http://localhost"
        print_status "✅ Backend API is accessible at: http://localhost/api"
    else
        print_warning "⚠️  Application may still be starting"
        print_status "Check status with: ai-chat-manager status"
    fi
    
    echo ""
    print_status "Service Management:"
    echo "  ai-chat-manager status    - Check service status"
    echo "  ai-chat-manager logs      - View logs"
    echo "  ai-chat-manager restart   - Restart if needed"
    
    BACKUP_FILE=$(cat /tmp/ai-chat-last-backup 2>/dev/null || echo "")
    if [[ -n "${BACKUP_FILE}" ]]; then
        echo ""
        print_status "Backup created at: ${BACKUP_FILE}"
        print_warning "Keep this backup until you verify the update works correctly"
    fi
    
    echo ""
    print_success "Update completed successfully!"
}

# Function to handle rollback
rollback() {
    print_error "Update failed. Starting rollback..."
    
    BACKUP_FILE=$(cat /tmp/ai-chat-last-backup 2>/dev/null || echo "")
    
    if [[ -n "${BACKUP_FILE}" && -d "${BACKUP_FILE}" ]]; then
        print_status "Restoring from backup: ${BACKUP_FILE}"
        
        # Restore database
        if [[ -f "${BACKUP_FILE}/database.sqlite" ]]; then
            sudo cp "${BACKUP_FILE}/database.sqlite" "${APP_DIR}/data/"
            sudo chown ${SERVICE_USER}:${SERVICE_USER} "${APP_DIR}/data/database.sqlite"
        fi
        
        # Restore configuration
        if [[ -f "${BACKUP_FILE}/.env" ]]; then
            sudo cp "${BACKUP_FILE}/.env" "${APP_DIR}/backend/"
            sudo chown ${SERVICE_USER}:${SERVICE_USER} "${APP_DIR}/backend/.env"
        fi
        
        # Restart services
        sudo systemctl restart ai-chat-backend
        sudo systemctl restart ai-chat-frontend
        
        print_success "Rollback completed"
    else
        print_error "No backup found for rollback"
        print_status "Manual intervention required"
    fi
}

# Main update function
main() {
    print_status "Starting AI Chat Interface update..."
    echo ""
    
    check_sudo
    check_installation
    
    # Trap errors for rollback
    trap rollback ERR
    
    create_backup
    stop_services
    update_code
    update_dependencies
    run_migrations
    update_config
    start_services
    verify_update
    cleanup
    
    # Disable error trap on success
    trap - ERR
    
    print_update_summary
}

# Parse command line arguments
case "${1:-}" in
    --help|-h)
        echo "AI Chat Interface Update Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --force        Skip confirmation prompts"
        echo "  --no-backup    Skip creating backup (not recommended)"
        echo ""
        echo "This script will:"
        echo "  1. Create a backup of current installation"
        echo "  2. Update application code from git"
        echo "  3. Update dependencies"
        echo "  4. Run database migrations"
        echo "  5. Update configuration"
        echo "  6. Restart services"
        echo "  7. Verify the update"
        exit 0
        ;;
    --force)
        FORCE=true
        ;;
    --no-backup)
        NO_BACKUP=true
        ;;
    "")
        # No arguments, continue with interactive mode
        ;;
    *)
        print_error "Unknown option: $1"
        print_status "Use --help for usage information"
        exit 1
        ;;
esac

# Confirmation prompt (unless --force is used)
if [[ "${FORCE:-}" != "true" ]]; then
    print_warning "This will update the AI Chat Interface application."
    print_warning "A backup will be created automatically."
    echo ""
    read -p "Do you want to continue? (y/N): " confirm
    if [[ $confirm != [yY] ]]; then
        print_status "Update cancelled."
        exit 0
    fi
fi

# Run the update
main "$@" 