@echo off
title NSDC Website
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js install karo pehle: https://nodejs.org  ^(LTS^) & pause & exit /b)
if not exist .dev.vars (
  echo ADMIN_PASSWORD=admin123> .dev.vars
  echo DEMO=true>> .dev.vars
  echo .dev.vars bana diya: admin password = admin123  ^(badalna ho to .dev.vars file edit karo^)
)
if not exist node_modules (echo Pehli baar install ho raha hai, 2-3 min lagenge... & call npm install)
start "" http://localhost:8788
call npm start
pause