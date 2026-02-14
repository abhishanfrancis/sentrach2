@echo off
echo Starting Tokenized Sentiment Oracle...
echo.

:: Kill any existing processes using our ports
echo Stopping any existing services...
taskkill /f /im python.exe 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8545 ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul
timeout /t 2 /nobreak > nul

:: Start Hardhat Node (local blockchain)
echo [1/4] Starting Hardhat Node...
start "Hardhat Node" cmd /k "cd /d %~dp0contracts && npx hardhat node"
start "Hardhat Node" cmd /k "cd /d %~dp0contracts && npx hardhat node"

:: Wait for Hardhat to fully start
echo Waiting for Hardhat node to start...
timeout /t 10 /nobreak > nul

:: Start Backend (don't wait for deployment)
echo [2/4] Starting Backend Server...
start "FastAPI Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

:: Start Dashboard
echo [3/4] Starting Dashboard...
start "Next.js Dashboard" cmd /k "cd /d %~dp0dashboard && npm run dev"

:: Deploy contract (after services are started)
echo [4/4] Deploying Smart Contract...
timeout /t 5 /nobreak > nul
cd /d %~dp0contracts
npx hardhat run scripts/deploy.js --network localhost

echo.
echo ========================================
echo All services started!
echo ========================================
echo Hardhat Node:    http://127.0.0.1:8545
echo Backend API:     http://localhost:8000
echo Dashboard:       http://localhost:3000
echo ========================================
echo.
pause
