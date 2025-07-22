#!/bin/bash

# AI Chat Interface - Linux Uninstallation Script
# This script removes the AI Chat application and all its components

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

# Function to confirm uninstallation
confirm_uninstall() {
    print_warning "This will completely remove the AI Chat Interface application."
    print_warning "All data, logs, and configuration will be deleted."
    echo ""
    
    read -p "Are you sure you want to proceed? (yes/no): " confirm
    if [[ $confirm != "yes" ]]; then
        print_status "Uninstallation cancelled."
        exit 0
    fi
    
    echo ""
    print_status "Starting uninstallation..."
}

# Function to stop and disable services
stop_services() {
    print_status "Stopping and disabling services..."
    
    # Stop services
    sudo systemctl stop ai-chat-backend || true
    sudo systemctl stop ai-chat-frontend || true
    
    # Disable services
    sudo systemctl disable ai-chat-backend || true
    sudo systemctl disable ai-chat-frontend || true
    
    print_success "Services stopped and disabled"
}

# Function to remove systemd services
remove_services() {
    print_status "Removing systemd service files..."
    
    sudo rm -f /etc/systemd/system/ai-chat-backend.service
    sudo rm -f /etc/systemd/system/ai-chat-frontend.service
    
    # Reload systemd
    sudo systemctl daemon-reload
    
    print_success "Systemd service files removed"
}

# Function to remove nginx configuration
remove_nginx_config() {
    print_status "Removing Nginx configuration..."
    
    # Remove nginx site configuration
    sudo rm -f /etc/nginx/sites-available/ai-chat-interface
    sudo rm -f /etc/nginx/sites-enabled/ai-chat-interface
    sudo rm -f /etc/nginx/conf.d/ai-chat-interface.conf
    
    # Test nginx configuration and restart if valid
    if sudo nginx -t 2>/dev/null; then
        sudo systemctl restart nginx || true
        print_success "Nginx configuration removed and restarted"
    else
        print_warning "Nginx configuration test failed, manual intervention may be needed"
    fi
}

# Function to remove application directory
remove_app_directory() {
    print_status "Removing application directory: ${APP_DIR}"
    
    if [[ -d "${APP_DIR}" ]]; then
        # Create backup of data if needed
        if [[ -f "${APP_DIR}/data/database.sqlite" ]]; then
            print_status "Creating backup of database..."
            cp "${APP_DIR}/data/database.sqlite" "/tmp/ai-chat-backup-$(date +%Y%m%d-%H%M%S).sqlite" || true
            print_status "Database backup saved to /tmp/"
        fi
        
        sudo rm -rf "${APP_DIR}"
        print_success "Application directory removed"
    else
        print_status "Application directory not found, skipping"
    fi
}

# Function to remove service user
remove_service_user() {
    print_status "Removing service user: ${SERVICE_USER}"
    
    if id "$SERVICE_USER" &>/dev/null; then
        sudo userdel --remove ${SERVICE_USER} || true
        print_success "Service user removed"
    else
        print_status "Service user not found, skipping"
    fi
}

# Function to remove management script
remove_management_script() {
    print_status "Removing management script..."
    
    sudo rm -f /usr/local/bin/ai-chat-manager
    print_success "Management script removed"
}

# Function to remove log rotation
remove_logrotate() {
    print_status "Removing log rotation configuration..."
    
    sudo rm -f /etc/logrotate.d/ai-chat-interface
    print_success "Log rotation configuration removed"
}

# Function to remove global npm packages (optional)
remove_global_packages() {
    print_status "Removing global npm packages..."
    
    # Remove serve if it was installed globally for this app
    if npm list -g serve &>/dev/null; then
        read -p "Remove global 'serve' package? (y/n): " remove_serve
        if [[ $remove_serve =~ ^[Yy]$ ]]; then
            sudo npm uninstall -g serve || true
        fi
    fi
}

# Function to clean up firewall rules (optional)
cleanup_firewall() {
    print_status "Cleaning up firewall rules..."
    
    print_warning "Firewall rules for HTTP/HTTPS will remain active."
    print_warning "Remove them manually if no longer needed:"
    echo "  UFW: sudo ufw delete allow 80/tcp && sudo ufw delete allow 443/tcp"
    echo "  Firewalld: sudo firewall-cmd --permanent --remove-service=http && sudo firewall-cmd --permanent --remove-service=https && sudo firewall-cmd --reload"
}

# Function to print uninstallation summary
print_uninstall_summary() {
    print_success "==================================="
    print_success "AI Chat Interface Uninstallation Complete!"
    print_success "==================================="
    echo ""
    print_status "What was removed:"
    echo "  ✓ Application directory: ${APP_DIR}"
    echo "  ✓ Service user: ${SERVICE_USER}"
    echo "  ✓ Systemd services"
    echo "  ✓ Nginx configuration"
    echo "  ✓ Management script"
    echo "  ✓ Log rotation configuration"
    echo ""
    print_status "What remains:"
    echo "  • Node.js installation"
    echo "  • System packages (nginx, git, etc.)"
    echo "  • Firewall rules"
    echo "  • Database backup in /tmp/ (if existed)"
    echo ""
    print_warning "Manual cleanup may be needed for:"
    echo "  • Global npm packages (serve, etc.)"
    echo "  • Node.js if no longer needed"
    echo "  • Nginx if no longer needed"
    echo ""
    print_success "Uninstallation completed successfully!"
}

# Main uninstallation function
main() {
    print_status "AI Chat Interface Uninstaller"
    echo ""
    
    check_root
    check_sudo
    confirm_uninstall
    
    stop_services
    remove_services
    remove_nginx_config
    remove_app_directory
    remove_service_user
    remove_management_script
    remove_logrotate
    remove_global_packages
    cleanup_firewall
    
    print_uninstall_summary
}

# Run uninstallation
main "$@" 