@echo off
chcp 65001 >nul
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Nema Node.js. Instaliraj sa https://nodejs.org  ^(LTS verzija^)
  echo Pa ponovo pokreni ovaj fajl.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Instaliram zavisnosti ^(prvi put traje minut-dva^)...
  call npm install
  if errorlevel 1 (
    echo Greska pri npm install.
    pause
    exit /b 1
  )
)

echo.
echo Pokrecem FirmaRacún...
echo Otvori u browseru: http://127.0.0.1:43127
echo Zaustavi sa Ctrl+C
echo.
call npm run dev
pause
