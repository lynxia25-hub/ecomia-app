# 🚀 CHEAT SHEET - Testing Rápido

**Copia este archivo en tu teléfono/tablet para tenerlo mientras testas!**

---

## 🎯 INICIO RÁPIDO (3 min)

### URLs Importantes
```
Home:       http://localhost:3000
Login:      http://localhost:3000/login
Chat:       http://localhost:3000/chat
API:        http://localhost:3000/api/chat
```

### Credenciales
```
Email:      (usuario real de Supabase Auth)
Password:   (tu contraseña)
```

### Flujo
```
1. http://localhost:3000/login
2. Ingresa tu usuario real
3. Enter → Redirect a /chat (2-5 seg)
4. ✅ Listo!
```

---

## 🧪 TESTS PARA HACERMENUAL (15 min)

### 1️⃣ Login
```
✓ Email cargó sin errores
✓ Puedo escribir usuario/contraseña
✓ Click "Iniciar Sesión" me lleva a /chat
✓ No hay errores rojos en F12 Console
```

### 2️⃣ Chat Básico
```
En /chat escribo: "Hola"
Presiono Enter
✓ Mi mensaje aparece arriba
✓ IA responde en 2-5 segundos
✓ Respuesta es algo coherente
```

### 3️⃣ Búsqueda
```
En /chat escribo: "¿Trends de termos 2026?"
✓ Se ve "Investigando..."
✓ Resultados de búsqueda aparecen
✓ IA sintetiza respuesta
```

### 4️⃣ Crear Tienda
```
En /chat escribo: "Crea una tienda"
✓ IA responde (puede ser simulación)
✓ Mensaje exitoso o error claro
```

### 5️⃣ Console Limpia
```
F12 → Console
✓ 0 errores rojos ❌
⚠️ Warnings (amarillo) = OK
```

### 6️⃣ Network OK
```
F12 → Network
Envío un mensaje
✓ POST /api/chat → Status 200
✓ Response tiene datos
```

### 7️⃣ No Crashes
```
✓ Puedo refrescar página (F5)
✓ Puedo cerrar pestañas
✓ Puedo escribir múltiples mensajes
✓ App no congela
```

---

## 🔍 DEBUGGING RÁPIDO

### Si Chat no responde
```
F12 → Network → POST /api/chat
├─ Status 200? ✓ OK
├─ Status 500? → Error en servidor
├─ Status 401? → Auth issue
└─ No aparece? → Problema conexión
```

### Si hay error rojo en Console
```
Copiar error completo
Ver si menciona:
├─ "Supabase" → Config issue
├─ "Network" → Conexión
├─ "Cannot find module" → npm ci
└─ Otro → Check TESTING_GUIDE.md
```

### Si página está en blanco
```
F12 → Console
├─ Ver si hay error
├─ Refresh (F5)
├─ Ctrl+Shift+Delete (clear cache)
├─ npm run dev (reinicia servidor)
```

---

## ✅ CHECKLIST COMPLETO

```
┌─────────────────────────────────────┐
Antes de Testing:
├─ [ ] npm run dev (¿está corriendo?)
├─ [ ] http://localhost:3000 (¿carga?)
├─ [ ] .env.local existe (? ls -la)

Durante Testing:
├─ [ ] Test 1: Login
├─ [ ] Test 2: Chat básico
├─ [ ] Test 3: Búsqueda
├─ [ ] Test 4: Crear tienda
├─ [ ] Test 5: Console limpia
├─ [ ] Test 6: Network OK
├─ [ ] Test 7: No crashes

Después del Testing:
├─ [ ] npm test (¿5/5 pasar?)
├─ [ ] npm run build (¿OK?)
├─ [ ] npm run lint (¿0 errores?)
└─ [ ] git push origin main
└─────────────────────────────────────┘
```

---

## 🛠️ COMANDOS ÚTILES

```bash
# Servidor
npm run dev              # Arranca (o usa npm run dev &)
pkill -f "npm run dev"   # Detiene servidor

# Testing
npm test                 # Corre tests
npm run test:watch       # Watch mode

# Setup
npm ci                   # Instala deps
node generate-env.js    # Genera .env.local

# Build
npm run build            # Build prod
npm run lint             # ESLint

# Git
git status               # Ver cambios
git add .                # Agregar todo
git commit -m "msg"      # Commit
git push origin main     # Push a main
```

---

## 🎨 ATAJOS DE TECLADO (DevTools)

```
F12                  # Abre DevTools
Ctrl+Shift+I         # También abre DevTools (Windows)
Cmd+Option+I         # DevTools en Mac
Ctrl+Shift+C          # Selecciona elemento
Ctrl+Shift+J         # Abre Console
F5                   # Refresh página
Ctrl+Shift+Delete    # Clear cache
Ctrl+K               # Clear console
```

---

## 🔴 ERRORES COMUNES & SOLUCIONES

| Error | Solución |
|-------|----------|
| "Port 3000 in use" | `lsof -i :3000` → `kill -9 <PID>` |
| "Module not found" | `npm ci` |
| "ENOENT .env.local" | `node generate-env.js` |
| "Cannot POST /api" | ¿Servidor corriendo? `npm run dev` |
| "Login fallido" | Check F12 Console logs |
| "Chat en blanco" | F12 → Refresh → Check errors |

---

## 📊 MÉTRICAS ESPERADAS

```
Load time:        2-4 segundos ✓
API response:     2-5 segundos ✓
Build time:       15-20 segundos ✓
Tests:            5/5 passing ✓
Errors:           0 rojos ✓
Warnings:        ⚠️ (normaliz) OK
```

---

## 🟢 SEÑAL VERDE CHECKLIST

```
Todos los tests manuales pasaron?
  ✅ SÍ → Puedes hacer git push origin main
  ❌ NO → Ver: TESTING_GUIDE.md#Resolución

Build & Tests automáticos pasan?
  ✅ SÍ → GitHub Actions ejecutó correctamente
  ❌ NO → Check GitHub Actions logs

Listo para Vercel?
  ✅ SÍ → vercel --prod
  ❌ NO → Vuelve a testing
```

---

## 🚀 DESPUÉS QUE TODO PASA

```bash
1. git add . && git commit -m "Ready for Vercel"
2. git push origin main
3. Espera: GitHub Actions se ejecuta (3-5 min)
4. Verifica: https://github.com/tu-repo/actions
5. Si OK: vercel --prod
6. ¡Celebra! 🎉
```

---

## 📞 REFERENCIAS RÁPIDAS

| Sitio | Link | Para Qué |
|-------|------|---------|
| Este archivo | - | Cheat sheet |
| TESTING_SUMMARY | ? | Resumen ejecutivo |
| TESTING_GUIDE | ? | Guía completa (45 min) |
| TESTING_STEPS | ? | Pasos visuales (30 min) |
| QUICK_START | ? | Acceso inmediato (5 min) |

---

## 📝 NOTAS PERSONALES

```
[Espacio para tus notas durante testing]

Prueba 1: _________________________________
Prueba 2: _________________________________
Prueba 3: _________________________________
Problemas encontrados: ____________________
_________________________________________

¿Listo para Vercel? ○ SÍ  ○ NO (¿por qué?)
```

---

**¿Listo?**  
👉 Abre http://localhost:3000/login e ingresa:
- **Email:** (usuario real de Supabase Auth)
- **Pwd:** (tu contraseña)

**¡A tesear! 🚀**

---

*Versión: 1.0 | Febrero 4, 2026*
