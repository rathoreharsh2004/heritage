@echo off
title Rathore Heritage CMS Server
cd /d "%~dp0"
echo ========================================================
echo  Rathore Heritage Developers CMS Server
echo  Public Website:  http://localhost:5000/
echo  Admin Panel:     http://localhost:5000/admin/
echo ========================================================
node server/index.js
pause
