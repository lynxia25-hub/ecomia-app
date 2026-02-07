#!/bin/bash

# Script para iniciar el servidor de desarrollo de EcomIA en background

echo "🚀 Iniciando EcomIA en background..."
echo ""

# Verificar que npm está disponible
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    exit 1
fi

# Crear directorio de logs si no existe
mkdir -p logs

# Obtener la fecha/hora actual para el nombre del log
LOG_FILE="logs/dev-$(date +%Y%m%d-%H%M%S).log"

# Iniciar el servidor en background
echo "📝 Logs guardados en: $LOG_FILE"
echo ""

# Detener cualquier proceso anterior
pkill -f "npm run dev" || true
sleep 1

# Iniciar en truly background (sin bloquear la terminal actual)
nohup npm run dev > "$LOG_FILE" 2>&1 &
PID=$!

# Guardar el PID en archivo para poder terminarlo después
echo "$PID" > .dev-pid

echo "✅ EcomIA iniciado en background (PID: $PID)"
echo ""
echo "🌐 Accede en: http://localhost:3000"
echo "📧 Email: admin@ecomia.com"
echo "🔑 Contraseña: admin123"
echo ""
echo "💡 Para detener el servidor, ejecuta: ./stop-dev.sh"
echo "📋 Para ver los logs en vivo: tail -f $LOG_FILE"
echo "📊 Para ver estado: ps -p $PID"
echo ""

# Dar un poco de tiempo para que el servidor inicie
sleep 3

# Mostrar si está corriendo
if ps -p $PID > /dev/null; then
    echo "✓ Servidor en ejecución. Espera 5 segundos para verificar http://localhost:3000"
else
    echo "⚠️ El proceso puede no haber iniciado correctamente. Revisar logs:"
    echo "   tail -f $LOG_FILE"
fi
