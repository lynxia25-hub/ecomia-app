@echo off
REM Script para detener EcomIA en Windows

echo.
echo 🛑 Deteniendo EcomIA...
echo.

REM Intentar detener el proceso npm
echo Buscando procesos npm/next...
tasklist | find /i "node.exe" >nul 2>nul
if errorlevel 1 (
    echo ❌ No hay procesos activos
    goto :end
)

REM Matar procesos
echo Deteniendo procesos...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak

echo.
echo ✅ EcomIA detenido exitosamente
echo.

:end
REM Verificar si el puerto 3000 está libre
netstat -ano | find ":3000" >nul 2>nul
if errorlevel 1 (
    echo ✅ Puerto 3000 libre
) else (
    echo ⚠️ Puerto 3000 aún está en uso
    echo Puerto 3000:
    netstat -ano | find ":3000"
)

echo.
pause
