#!/bin/bash

# Script para detener el servidor de desarrollo de EcomIA

echo "🛑 Deteniendo EcomIA..."
echo ""

# Intentar detener usando el PID guardado
if [ -f .dev-pid ]; then
    PID=$(cat .dev-pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "Deteniendo proceso PID: $PID"
        kill $PID
        sleep 2
        if ps -p $PID > /dev/null 2>&1; then
            echo "Forzando cierre del proceso..."
            kill -9 $PID
        fi
        rm .dev-pid
    fi
fi

# También matar cualquier proceso npm o next que esté corriendo
echo "Buscando procesos npm/next activos..."
pkill -f "npm run dev" || true
pkill -f "next dev" || true

sleep 1

# Verificar que fue detenido
if ! pgrep -f "npm run dev" > /dev/null; then
    echo ""
    echo "✅ EcomIA detenido exitosamente"
    echo ""
else
    echo ""
    echo "⚠️ Aún hay procesos activos. Intenta:"
    echo "   pkill -9 -f 'npm run dev'"
    echo ""
fi

# Mostrar procesos restantes en puerto 3000
echo "Verificando puerto 3000..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️ Puerto 3000 aún está en uso"
    echo "Procesos en puerto 3000:"
    lsof -i :3000 || true
else
    echo "✅ Puerto 3000 libre"
fi
