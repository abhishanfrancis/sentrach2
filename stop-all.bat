@echo off
echo Stopping all services...

:: Kill Python (backend)
taskkill /f /im python.exe 2>nul

:: Kill Node (dashboard and hardhat)
taskkill /f /im node.exe 2>nul

echo All services stopped.
pause
