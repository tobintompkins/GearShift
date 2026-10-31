@echo off
set "NODE_DIR=C:\Program Files\nodejs"
set "PATH=%NODE_DIR%;%PATH%"
cd /d "%~dp0"

echo Installing dependencies (if needed)...
call "%NODE_DIR%\npm.cmd" install
if errorlevel 1 exit /b 1

echo.
echo Starting Next.js dev server...
echo Open http://localhost:3000 in your browser
echo.
call "%NODE_DIR%\npm.cmd" run dev
pause
