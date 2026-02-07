@echo off
REM Script para iniciar EcomIA en Windows

echo.
echo 🚀 Iniciando EcomIA en background...
echo.

REM Verificar que npm está disponible
where npm >nul 2>nul
if errorlevel 1 (
    echo ❌ npm no está instalado
    pause
    exit /b 1
)

REM Crear directorio de logs si no existe
if not exist logs mkdir logs

REM Obtener timestamp para el log
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set LOG_FILE=logs\dev-%mydate%-%mytime%.log

echo 📝 Logs guardados en: %LOG_FILE%
echo.

REM Detener procesos anteriores
taskkill /F /IM node.exe >nul 2>&1

REM Iniciar en background (usando start)
echo Iniciando servidor...
start "EcomIA Dev Server" npm run dev > %LOG_FILE% 2>&1

echo.
echo ✅ EcomIA iniciado en background
echo.
echo 🌐 Accede en: http://localhost:3000
echo 📧 Email: admin@ecomia.com
echo 🔑 Contraseña: admin123
echo.
echo 💡 Para detener el servidor: ejecuta stop-dev.bat
echo 📋 Para ver los logs: type %LOG_FILE%
echo.

timeout /t 3 /nobreak

REM Intentar abrir el navegador
start http://localhost:3000

echo.
echo Espera a que cargue la página...
