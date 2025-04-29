# Chatware Installation and Startup Script (PowerShell version)

# Function to write colored output
function Write-ColorOutput {
    param (
        [Parameter(Mandatory=$true)]
        [string]$Message,
        
        [Parameter(Mandatory=$false)]
        [string]$ForegroundColor = "White"
    )
    
    Write-Host $Message -ForegroundColor $ForegroundColor
}

# Display header
Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "      Chatware Installation and Startup Script" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

# Check for Node.js installation
Write-ColorOutput "Checking for Node.js installation..." "Yellow"
try {
    $nodeVersion = node --version
    Write-ColorOutput "[OK] Node.js is installed: $nodeVersion" "Green"
} catch {
    Write-ColorOutput "[ERROR] Node.js is not installed. Please install Node.js before running this script." "Red"
    Write-ColorOutput "Visit https://nodejs.org to download and install Node.js." "Yellow"
    Read-Host "Press Enter to exit"
    exit 1
}

# Create necessary directories
if (-not (Test-Path "backend\node\uploads")) {
    Write-ColorOutput "Creating uploads directory..." "Yellow"
    New-Item -Path "backend\node\uploads" -ItemType Directory -Force | Out-Null
    Write-ColorOutput "[OK] Uploads directory created" "Green"
}

# Create backend .env file if it doesn't exist
Write-ColorOutput "Checking backend environment configuration..." "Yellow"
if (-not (Test-Path "backend\node\.env")) {
    Write-ColorOutput "[INFO] Creating backend .env file..." "Yellow"
    
    $backendEnv = @"
# Server Configuration
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
"@
    
    Set-Content -Path "backend\node\.env" -Value $backendEnv
    Write-ColorOutput "[OK] Backend .env file created" "Green"
} else {
    Write-ColorOutput "[OK] Backend .env file already exists" "Green"
}

# Create web client .env file if it doesn't exist
Write-ColorOutput "Checking web client environment configuration..." "Yellow"
if (-not (Test-Path "frontend\web\.env")) {
    Write-ColorOutput "[INFO] Creating web client .env file..." "Yellow"
    
    $webEnv = @"
# API Configuration
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000

# Feature Flags
REACT_APP_ENABLE_ENCRYPTION=true
REACT_APP_ENABLE_LOCATION_TRACKING=true
"@
    
    Set-Content -Path "frontend\web\.env" -Value $webEnv
    Write-ColorOutput "[OK] Web client .env file created" "Green"
} else {
    Write-ColorOutput "[OK] Web client .env file already exists" "Green"
}

# Create mobile client .env file if it doesn't exist
Write-ColorOutput "Checking mobile client environment configuration..." "Yellow"
if (-not (Test-Path "frontend\mobile\.env")) {
    Write-ColorOutput "[INFO] Creating mobile client .env file..." "Yellow"
    
    $mobileEnv = @"
API_URL=http://10.0.2.2:5000
SOCKET_URL=http://10.0.2.2:5000

# Feature Flags
ENABLE_ENCRYPTION=true
ENABLE_LOCATION_TRACKING=true
"@
    
    Set-Content -Path "frontend\mobile\.env" -Value $mobileEnv
    Write-ColorOutput "[OK] Mobile client .env file created" "Green"
} else {
    Write-ColorOutput "[OK] Mobile client .env file already exists" "Green"
}

# Install backend dependencies
Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "      Installing Backend Dependencies" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

Push-Location "backend\node"
Write-ColorOutput "Installing backend dependencies..." "Yellow"
npm install
Pop-Location

# Install web client dependencies
Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "      Installing Web Client Dependencies" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

Push-Location "frontend\web"
Write-ColorOutput "Installing web client dependencies..." "Yellow"
npm install
Pop-Location

# Install mobile client dependencies
Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "      Installing Mobile Client Dependencies" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

Push-Location "frontend\mobile"
Write-ColorOutput "Installing mobile client dependencies..." "Yellow"
npm install
Pop-Location

# Start all services
Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "      Starting Chatware Application" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

Write-ColorOutput "Starting backend server, web client, and mobile app..." "Yellow"
Write-Host "`nChatware will open these applications in separate windows:"
Write-Host " - Backend API Server: http://localhost:5000"
Write-Host " - Web Client: http://localhost:3000"
Write-Host " - Mobile App (Expo): Will provide QR code to scan`n"

Read-Host "Press Enter to start all services"

# Start backend server
$backendJob = Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$((Get-Location).Path)\backend\node'; npm run dev`"" -PassThru

# Wait a bit for backend to start
Write-ColorOutput "Starting backend server and waiting for initialization..." "Yellow"
Start-Sleep -Seconds 10

# Start web client
$webJob = Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$((Get-Location).Path)\frontend\web'; npm start`"" -PassThru

# Start mobile app
$mobileJob = Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$((Get-Location).Path)\frontend\mobile'; npx expo start`"" -PassThru

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "All services have been started!" -ForegroundColor Green
Write-Host "Check the opened PowerShell windows for details." -ForegroundColor Green
Write-Host "========================================================`n" -ForegroundColor Green

Read-Host "Press Enter to exit this script" 