@echo off
title Dzikri-Wedding Launcher
echo ======================================================
echo    Menjalankan Wedding Invitation (Frontend & Backend)
echo ======================================================
echo.

start "Wedding Backend" cmd /k "cd /d %~dp0backend && node index.js"
timeout /t 2 /nobreak >nul

start "Wedding Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 3 /nobreak >nul

start http://localhost:5173
echo.
echo Aplikasi telah berjalan!
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo Admin:    http://localhost:5173/login (User: admin | Pass: admin123)
echo.
echo Tekan sembarang tombol untuk menutup jendela launcher ini...
pause >nul
