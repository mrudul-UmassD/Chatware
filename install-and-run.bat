@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   Chatware Installation and Startup Script
echo ========================================================
echo.

:: Check for Node.js installation
echo Checking for Node.js installation...
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js before running this script.
    echo Visit https://nodejs.org to download and install Node.js.
    pause
    exit /b 1
)
echo [OK] Node.js is installed.

:: Create necessary directories if they don't exist
if not exist "backend\node\uploads" mkdir "backend\node\uploads"

:: Check and create backend .env file if it doesn't exist
echo Checking backend environment configuration...
if not exist "backend\node\.env" (
    echo [INFO] Creating backend .env file...
    (
        echo # Server Configuration
        echo PORT=5000
        echo NODE_ENV=development
        echo.
        echo # MongoDB Connection
        echo MONGODB_USER=httpgodmail
        echo MONGODB_PASSWORD=MongoDB
        echo MONGODB_CLUSTER=cluster0
        echo MONGODB_URI=mongodb+srv://httpgodmail:MongoDB@cluster0.cfeowwg.mongodb.net/
        echo.
        echo # JWT Authentication
        echo JWT_SECRET=84f98sd4f98sd4f984f9s8df4s98df4
        echo JWT_EXPIRE=30d
        echo JWT_REFRESH_SECRET=98sd4f98s4df98s4d9f84sd9f8sd4f
        echo JWT_REFRESH_EXPIRE=60d
        echo.
        echo # Encryption
        echo ENCRYPTION_SECRET=4d58f4sd58f4sd58f4sd58f4ds85f4
        echo.
        echo # Socket Configuration
        echo SOCKET_CORS_ORIGIN=http://localhost:3000
        echo.
        echo # File Upload
        echo MAX_FILE_SIZE=5000000
        echo UPLOAD_PATH=./uploads
        echo.
        echo # Email Configuration
        echo EMAIL_HOST=smtp.example.com
        echo EMAIL_PORT=587
        echo EMAIL_USER=your_email@example.com
        echo EMAIL_PASSWORD=your_email_password
        echo EMAIL_FROM=noreply@chatware.com
        echo.
        echo # Admin Configuration
        echo ADMIN_SETUP_KEY=admin_setup_secret_key
    ) > "backend\node\.env"
    echo [OK] Backend .env file created.
) else (
    echo [OK] Backend .env file already exists.
)

:: Check and create web client .env file if it doesn't exist
echo Checking web client environment configuration...
if not exist "frontend\web\.env" (
    echo [INFO] Creating web client .env file...
    (
        echo # API Configuration
        echo REACT_APP_API_URL=http://localhost:5000
        echo REACT_APP_SOCKET_URL=http://localhost:5000
        echo.
        echo # Feature Flags
        echo REACT_APP_ENABLE_ENCRYPTION=true
        echo REACT_APP_ENABLE_LOCATION_TRACKING=true
    ) > "frontend\web\.env"
    echo [OK] Web client .env file created.
) else (
    echo [OK] Web client .env file already exists.
)

:: Check and create mobile client .env file if it doesn't exist
echo Checking mobile client environment configuration...
if not exist "frontend\mobile\.env" (
    echo [INFO] Creating mobile client .env file...
    (
        echo API_URL=http://10.0.2.2:5000
        echo SOCKET_URL=http://10.0.2.2:5000
        echo.
        echo # Feature Flags
        echo ENABLE_ENCRYPTION=true
        echo ENABLE_LOCATION_TRACKING=true
    ) > "frontend\mobile\.env"
    echo [OK] Mobile client .env file created.
) else (
    echo [OK] Mobile client .env file already exists.
)

:: Install backend dependencies and start the server
echo.
echo ========================================================
echo   Installing Backend Dependencies
echo ========================================================
cd backend\node
echo Installing backend dependencies...
call npm install

:: Install web client dependencies
echo.
echo ========================================================
echo   Installing Web Client Dependencies
echo ========================================================
cd ..\..\frontend\web
echo Installing web client dependencies...
call npm install

:: Install mobile client dependencies
echo.
echo ========================================================
echo   Installing Mobile Client Dependencies
echo ========================================================
cd ..\mobile
echo Installing mobile client dependencies...
call npm install

:: Start all services
echo.
echo ========================================================
echo   Starting Chatware Application
echo ========================================================
echo.
echo Starting backend server, web client, and mobile app...
echo.
echo Chatware will open these applications in separate windows:
echo  - Backend API Server: http://localhost:5000
echo  - Web Client: http://localhost:3000
echo  - Mobile App (Expo): Will provide QR code to scan
echo.
echo Press any key to start all services...
pause > nul

:: Start backend server in a new window
cd ..\..\backend\node
start cmd /k "title Chatware Backend && npm run dev"

:: Wait for backend to initialize before starting web client
ping 127.0.0.1 -n 6 > nul

:: Start web client in a new window
cd ..\..\frontend\web
start cmd /k "title Chatware Web Client && npm start"

:: Start mobile app in a new window
cd ..\mobile
start cmd /k "title Chatware Mobile App && npx expo start"

:: Return to the original directory
cd ..\..

echo.
echo ========================================================
echo All services have been started! 
echo Check the opened command windows for details.
echo ========================================================
echo.
echo You can close this window now or press any key to exit.
pause > nul

endlocal 