@echo off
REM Quick start script for Sovereign Ledger (Windows)

echo.
echo ==========================================
echo Sovereign Ledger - Quick Start (Windows)
echo ==========================================
echo.

REM Check prerequisites
echo Checking prerequisites...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js 18+
    exit /b 1
)

where java >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Java not found. Please install Java 17+
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('java -version 2^>^&1') do set JAVA_VERSION=%%i

echo OK: Node.js version: %NODE_VERSION%
echo OK: Java found
echo.

echo ==========================================
echo Setup Instructions
echo ==========================================
echo.

echo 1. BACKEND SETUP (Spring Boot)
echo    cd backend
echo    mvnw.cmd clean install
echo    mvnw.cmd spring-boot:run
echo    Runs on: http://localhost:8080
echo.

echo 2. FRONTEND SETUP (React + Vite)
echo    npm install
echo    npm run dev
echo    Runs on: http://localhost:5173
echo.

echo 3. BLOCKCHAIN SETUP (Optional - Hardhat)
echo    cd blockchain
echo    npm install
echo    npm run node
echo    Runs on: http://localhost:8545
echo.

echo ==========================================
echo Installing frontend dependencies...
echo ==========================================
echo.

call npm install

echo.
echo SUCCESS: Setup complete!
echo.
echo Now run these in separate terminals:
echo.
echo Terminal 1: Backend
echo   cd backend
echo   mvnw.cmd spring-boot:run
echo.
echo Terminal 2: Frontend
echo   npm run dev
echo.
echo Terminal 3 (Optional): Blockchain
echo   cd blockchain
echo   npm run node
echo   (Deploy: npm run deploy-local)
echo.
echo Open http://localhost:5173 in your browser!
echo.
pause
