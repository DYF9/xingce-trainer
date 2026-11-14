@echo off
setlocal
cd /d "%~dp0"
title XC Sprint - local server
where node >nul 2>nul
if %errorlevel%==0 (
  node server.mjs
  goto end
)
where python >nul 2>nul
if %errorlevel%==0 (
  echo Node.js not found, fallback to python http.server on port 8080
  echo Run  ipconfig  to find your IPv4 address, then open http://THAT-IP:8080 on the phone.
  python -m http.server 8080
  goto end
)
echo.
echo Node.js / Python not found.
echo Install Node.js from https://nodejs.org and run this file again.
pause
:end
