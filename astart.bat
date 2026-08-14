@echo off
title JayMap Launcher

echo Starting Next.js...
start "Next.js" cmd /k "npm run dev"

echo Starting TileServer GL Light...
start "TileServer" cmd /k "npx tileserver-gl-light --config tileserver/config.json"

echo.
echo ============================
echo   All servers started.
echo ============================
pause