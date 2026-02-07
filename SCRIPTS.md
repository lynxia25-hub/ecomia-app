# 🚀 Scripts de Control del Servidor EcomIA

Este directorio contiene scripts para iniciar y detener el servidor de desarrollo de forma fácil.

---

## 🖥️ **Para LINUX / MAC (Dev Container, Ubuntu)**

### Arrancar el servidor en background:
```bash
bash start-dev.sh
```

**Resultado:**
- ✅ Servidor inicia en background (no bloquea la terminal)
- 📝 Logs se guardan en `logs/dev-YYYYMMDD-HHMMSS.log`
- 🌐 Accesible en http://localhost:3000
- 📧 Credenciales: usuario real de Supabase Auth

### Detener el servidor:
```bash
bash stop-dev.sh
```

### Ver logs en vivo:
```bash
tail -f logs/dev-*.log
```

---

## 🪟 **Para WINDOWS**

### Arrancar el servidor en background:
1. **Doble clic** en `start-dev.bat`
2. O abre terminal (cmd) y ejecuta:
```cmd
start-dev.bat
```

**Resultado:**
- ✅ Abre una **ventana nueva** ("EcomIA Dev Server") que ejecuta el servidor
- 📝 Logs se guardan en `logs\dev-YYYYMMDD-HHMMSS.log`
- 🌐 Intenta abrir http://localhost:3000 automáticamente
- 📧 Credenciales: usuario real de Supabase Auth

### Detener el servidor:
1. **Doble clic** en `stop-dev.bat`
2. O abre terminal (cmd) y ejecuta:
```cmd
stop-dev.bat
```

---

## 📋 Comparación

| Acción | Linux/Mac | Windows |
|--------|-----------|---------|
| **Arrancar** | `bash start-dev.sh` | Doble-clic `start-dev.bat` o `start-dev.bat` en cmd |
| **Detener** | `bash stop-dev.sh` | Doble-clic `stop-dev.bat` o `stop-dev.bat` en cmd |
| **Logs** | `tail -f logs/dev-*.log` | `type logs\dev-*.log` |
| **Ver estado** | `ps aux \| grep npm` | `tasklist \| find "node"` |

---

## 💡 Consejos

### Si el servidor no inicia:
```bash
# Linux/Mac: ver logs detallatos
tail -f logs/dev-*.log

# Windows: ver el contenido del log
type logs\dev-*.log
```

### Si el puerto 3000 está ocupado:
```bash
# Linux/Mac: liberar puerto
pkill -f "npm run dev"
lsof -i :3000

# Windows: liberar puerto
taskkill /F /IM node.exe
netstat -ano | find ":3000"
```

### Para desarrollo más avanzado:
```bash
# Iniciar con logs en primer plano
npm run dev

# O en terminal separada: ver logs del navegador
npm run dev 2>&1 | tee logs/debug.log
```

---

## 🔧 Cómo funcionan los scripts

### `start-dev.sh` (Linux/Mac)
- Mata procesos anteriores
- Inicia `npm run dev` en background con `nohup`
- Guarda el PID en `.dev-pid` para detenerlo después
- Redirige output a logs
- Abre acceso automático en navegador

### `start-dev.bat` (Windows)
- Mata procesos node.exe anteriores
- Abre una ventana nueva con `start` comando
- Ejecuta `npm run dev` en esa ventana
- Intenta abrir navegador automáticamente

---

## 🎯 Flujo típico de trabajo

**Sesión 1 - Desarrollo:**
```bash
# Terminal 1: Arrancar servidor
bash start-dev.sh

# Terminal 2: Editar código
code src/
```

**Si subes cambios:**
- El servidor auto-recarga (Turbopack HMR)
- Los logs muestran estado en tiempo real

**Cuando terminas:**
```bash
bash stop-dev.sh
```

---

**¿Problemas?** Revisa los logs o ejecuta manualmente:
```bash
npm run dev
```

Para ver qué está pasando en tiempo real. 📊
