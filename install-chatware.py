#!/usr/bin/env python3
"""
Chatware Installation and Launcher Script
Cross-platform script to set up and run the Chatware application.
"""

import os
import sys
import subprocess
import platform
import time
from pathlib import Path

# ANSI color codes for colored output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


def print_colored(message, color):
    """Print a message in color"""
    print(f"{color}{message}{Colors.ENDC}")


def print_header(message):
    """Print a header message"""
    print("\n" + "=" * 56)
    print_colored(f"  {message}", Colors.CYAN + Colors.BOLD)
    print("=" * 56)


def check_node_installed():
    """Check if Node.js is installed"""
    print_colored("Checking for Node.js installation...", Colors.YELLOW)
    
    try:
        result = subprocess.run(
            ["node", "--version"], 
            capture_output=True, 
            text=True, 
            check=False
        )
        
        if result.returncode == 0:
            print_colored(f"[OK] Node.js is installed: {result.stdout.strip()}", Colors.GREEN)
            return True
        else:
            print_colored("[ERROR] Node.js not found", Colors.RED)
            return False
    except FileNotFoundError:
        print_colored("[ERROR] Node.js is not installed", Colors.RED)
        return False


def create_env_files(project_dir):
    """Create environment files if they don't exist"""
    # Backend .env file
    backend_env_path = project_dir / "backend" / "node" / ".env"
    if not backend_env_path.exists():
        print_colored("[INFO] Creating backend .env file...", Colors.YELLOW)
        
        backend_env_content = """# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_USER=httpgodmail
MONGODB_PASSWORD=MongoDB
MONGODB_CLUSTER=cluster0
MONGODB_URI=mongodb+srv://httpgodmail:MongoDB@cluster0.cfeowwg.mongodb.net/

# JWT Authentication
JWT_SECRET=84f98sd4f98sd4f984f9s8df4s98df4
JWT_EXPIRE=30d
JWT_REFRESH_SECRET=98sd4f98s4df98s4d9f84sd9f8sd4f
JWT_REFRESH_EXPIRE=60d

# Encryption
ENCRYPTION_SECRET=4d58f4sd58f4sd58f4sd58f4ds85f4

# Socket Configuration
SOCKET_CORS_ORIGIN=http://localhost:3000

# File Upload
MAX_FILE_SIZE=5000000
UPLOAD_PATH=./uploads

# Email Configuration
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=noreply@chatware.com

# Admin Configuration
ADMIN_SETUP_KEY=admin_setup_secret_key
"""
        
        with open(backend_env_path, 'w', encoding='utf-8') as f:
            f.write(backend_env_content)
        
        print_colored("[OK] Backend .env file created", Colors.GREEN)
    else:
        print_colored("[OK] Backend .env file already exists", Colors.GREEN)
    
    # Web .env file
    web_env_path = project_dir / "frontend" / "web" / ".env"
    if not web_env_path.exists():
        print_colored("[INFO] Creating web client .env file...", Colors.YELLOW)
        
        web_env_content = """# API Configuration
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000

# Feature Flags
REACT_APP_ENABLE_ENCRYPTION=true
REACT_APP_ENABLE_LOCATION_TRACKING=true
"""
        
        with open(web_env_path, 'w', encoding='utf-8') as f:
            f.write(web_env_content)
        
        print_colored("[OK] Web client .env file created", Colors.GREEN)
    else:
        print_colored("[OK] Web client .env file already exists", Colors.GREEN)
    
    # Mobile .env file
    mobile_env_path = project_dir / "frontend" / "mobile" / ".env"
    if not mobile_env_path.exists():
        print_colored("[INFO] Creating mobile client .env file...", Colors.YELLOW)
        
        mobile_env_content = """API_URL=http://10.0.2.2:5000
SOCKET_URL=http://10.0.2.2:5000

# Feature Flags
ENABLE_ENCRYPTION=true
ENABLE_LOCATION_TRACKING=true
"""
        
        with open(mobile_env_path, 'w', encoding='utf-8') as f:
            f.write(mobile_env_content)
        
        print_colored("[OK] Mobile client .env file created", Colors.GREEN)
    else:
        print_colored("[OK] Mobile client .env file already exists", Colors.GREEN)


def install_dependencies(project_dir):
    """Install npm dependencies for all components"""
    # Backend dependencies
    print_header("Installing Backend Dependencies")
    
    os.chdir(project_dir / "backend" / "node")
    print_colored("Installing backend dependencies...", Colors.YELLOW)
    subprocess.run(["npm", "install"], check=True)
    
    # Web client dependencies
    print_header("Installing Web Client Dependencies")
    
    os.chdir(project_dir / "frontend" / "web")
    print_colored("Installing web client dependencies...", Colors.YELLOW)
    subprocess.run(["npm", "install"], check=True)
    
    # Mobile client dependencies
    print_header("Installing Mobile Client Dependencies")
    
    os.chdir(project_dir / "frontend" / "mobile")
    print_colored("Installing mobile client dependencies...", Colors.YELLOW)
    subprocess.run(["npm", "install"], check=True)
    
    # Return to project directory
    os.chdir(project_dir)


def start_services(project_dir):
    """Start all application services"""
    print_header("Starting Chatware Application")
    
    print_colored("Starting backend server, web client, and mobile app...", Colors.YELLOW)
    print("\nChatware will open these applications in separate windows:")
    print(" - Backend API Server: http://localhost:5000")
    print(" - Web Client: http://localhost:3000")
    print(" - Mobile App (Expo): Will provide QR code to scan\n")
    
    input("Press Enter to start all services...")
    
    system = platform.system()
    
    # Start backend
    print_colored("\nStarting backend server...", Colors.YELLOW)
    backend_dir = str(project_dir / "backend" / "node")
    
    if system == "Windows":
        backend_process = subprocess.Popen(
            ["start", "cmd", "/k", f"cd {backend_dir} && npm run dev"],
            shell=True
        )
    else:  # Linux/Mac
        terminal_cmd = "gnome-terminal" if system == "Linux" else "open -a Terminal"
        backend_process = subprocess.Popen(
            f"{terminal_cmd} -- bash -c 'cd {backend_dir} && npm run dev; exec bash'",
            shell=True
        )
    
    # Give backend time to start
    print_colored("Waiting for backend to initialize...", Colors.YELLOW)
    time.sleep(10)
    
    # Start web client
    print_colored("Starting web client...", Colors.YELLOW)
    web_dir = str(project_dir / "frontend" / "web")
    
    if system == "Windows":
        web_process = subprocess.Popen(
            ["start", "cmd", "/k", f"cd {web_dir} && npm start"],
            shell=True
        )
    else:  # Linux/Mac
        web_process = subprocess.Popen(
            f"{terminal_cmd} -- bash -c 'cd {web_dir} && npm start; exec bash'",
            shell=True
        )
    
    # Start mobile app
    print_colored("Starting mobile app...", Colors.YELLOW)
    mobile_dir = str(project_dir / "frontend" / "mobile")
    
    if system == "Windows":
        mobile_process = subprocess.Popen(
            ["start", "cmd", "/k", f"cd {mobile_dir} && npx expo start"],
            shell=True
        )
    else:  # Linux/Mac
        mobile_process = subprocess.Popen(
            f"{terminal_cmd} -- bash -c 'cd {mobile_dir} && npx expo start; exec bash'",
            shell=True
        )
    
    print_colored("\nAll services have been started!", Colors.GREEN)
    print_colored("Check the opened terminal windows for details.", Colors.GREEN)


def main():
    """Main entry point for the script"""
    print_header("Chatware Installation and Startup Script")
    
    # Get project directory (where this script is located)
    project_dir = Path(os.path.dirname(os.path.abspath(__file__)))
    
    # Check Node.js installation
    if not check_node_installed():
        print_colored("Please install Node.js before running this script.", Colors.YELLOW)
        print_colored("Visit https://nodejs.org to download and install Node.js.", Colors.YELLOW)
        input("Press Enter to exit...")
        sys.exit(1)
    
    # Create uploads directory if it doesn't exist
    uploads_dir = project_dir / "backend" / "node" / "uploads"
    if not uploads_dir.exists():
        print_colored("Creating uploads directory...", Colors.YELLOW)
        uploads_dir.mkdir(parents=True, exist_ok=True)
        print_colored("[OK] Uploads directory created", Colors.GREEN)
    
    # Create env files
    create_env_files(project_dir)
    
    # Install dependencies
    install_dependencies(project_dir)
    
    # Start services
    start_services(project_dir)
    
    print("\n" + "=" * 56)
    input("Press Enter to exit this script...")


if __name__ == "__main__":
    main() 