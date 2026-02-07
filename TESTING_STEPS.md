# 🎥 Testing Paso a Paso - Guía Visual

**Estado del Servidor:** ✅ http://localhost:3000 (CORRIENDO)

---

## 📍 PASO 1: Abre el Navegador

```
Dirección:  http://localhost:3000
Resultado esperado:
┌─────────────────────────────────────────────┐
│  🏠 EcomIA - Home Page                     │
│                                             │
│  Bienvenido a EcomIA                        │
│  Consultor de Comercio Electrónico          │
│                                             │
│  [Iniciar Sesión]  [Registrarse]           │
└─────────────────────────────────────────────┘
```

**✓ Verificar:**
- [ ] Logo de EcomIA visible
- [ ] Texto de bienvenida aparece
- [ ] Botones "Iniciar Sesión" clickeables
- [ ] No hay errores en consola (F12)

**Tiempo:** 3 segundos

---

## 📍 PASO 2: Navega a Login

```
Dirección:  http://localhost:3000/login
O presiona:  [Iniciar Sesión]

Resultado esperado:
┌──────────────────────────────────────────────┐
│  🔐 Iniciar Sesión                          │
│                                              │
│  [Logo EcomIA]                              │
│                                              │
│  Email: [________________]                  │
│  Contraseña: [________________]              │
│                                              │
│  ☐ Continuar con Email Mágico              │
│  ☐ Continuar con Contraseña                │
│                                              │
│  [Iniciar Sesión]                          │
└──────────────────────────────────────────────┘
```

**✓ Verificar:**
- [ ] Formulario de login visible
- [ ] Campo de email y contraseña presentes
- [ ] Opciones de login disponibles
- [ ] Sin errores

**Tiempo:** 2 segundos

---

## 📍 PASO 3: Ingresa Credenciales de Prueba

```
INGRESA:
┌────────────────────────────────────┐
│ Email:  (usuario real)             │
│ Pwd:    (tu contraseña)            │
└────────────────────────────────────┘

ACCIÓN:
Presiona [Iniciar Sesión] o Enter

ESPERADO:
✓ Spinner de carga breve (1-2 segundos)
✓ Redirige a http://localhost:3000/chat
✓ Sin errores en consola
```

**Tiempo:** 3-5 segundos

---

## 📍 PASO 4: Chat Page Cargó ✅

```
Dirección:  http://localhost:3000/chat

LAYOUT ESPERADO:
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  RESEARCH DISPLAY (Izquierda 75%)    │ CHAT (Derecha 25%) │
│  ═════════════════════════════════   │ ═══════════════   │
│                                      │ Mensajes:         │
│  [Áreas de búsqueda vacía]           │ [User: Hola]      │
│                                      │ [AI: Hola! ...]   │
│                                      │                   │
│  [Spinner si hay carga]              │ Input: ________   │
│                                      │ [Enviar]          │
└────────────────────────────────────────────────────────────┘

COMPONENTES:
✓ ResearchDisplay cargado
✓ ChatSidebar visible
✓ Input de mensajes funcional
✓ Sin errores rojos en consola
```

**✓ Verificar:**
- [ ] Chat cargó sin errores
- [ ] Puedes ver el input de mensajes
- [ ] No hay ningún error rojo

**Tiempo:** 2 segundos

---

## 📍 PASO 5: Envía tu Primer Mensaje

```
ESCRIBE EN EL INPUT:
┌─────────────────────────────────────┐
│ "Hola, quiero vender termos"        │
└─────────────────────────────────────┘

PRESIONA:
- Enter O
- Botón [Enviar]

ESPERADO:
┌─────────────────────────────────────────┐
│ Me:  Hola, quiero vender termos         │
│                                         │
│ [Spinner/Cargando...]                  │
│ (2-5 segundos)                          │
│                                         │
│ EcomIA: Excelente idea. Déjame         │
│ investigar la tendencia de termos      │
│ en el mercado...                        │
│                                         │
│ [Resultados de investigación...]       │
│                                         │
│ Te recomiendo 3 opciones:              │
│ 1. Termos de viaje...                  │
│ 2. Termos inteligentes...              │
│ 3. Termos eco-friendly...              │
└─────────────────────────────────────────┘
```

**✓ Verificar en DevTools (F12 → Network):**
```
Request: POST /api/chat
Status:  200 OK ✅
Response streaming de texto
```

**Tiempo:** 5-10 segundos

---

## 📍 PASO 6: Prueba Búsqueda Mercado (searchMarket)

```
ESCRIBE EN EL INPUT:
┌──────────────────────────────────────────────┐
│ "¿Cual es la tendencia de termos en 2026?"  │
└──────────────────────────────────────────────┘

ESPERADO:
┌──────────────────────────────────────────────────┐
│ Me: ¿Cual es la tendencia de termos en 2026?    │
│                                                  │
│ EcomIA: [Investigando el mercado...]            │
│         [🔍 Búsqueda en Tavily...]              │
│         [3 resultados encontrados]              │
│                                                  │
│ Resultados:                                      │
│ ├─ Tendencia 1: Termos inteligentes...          │
│ ├─ Tendencia 2: Materiales eco...              │
│ └─ Tendencia 3: Mercado LATAM...               │
│                                                  │
│ Análisis:                                        │
│ Basándome en mis búsquedas, veo que...         │
│ [Respuesta sintetizada de la IA]               │
└──────────────────────────────────────────────────┘
```

**✓ Verificar:**
- [ ] Se ve sección "Investigando..."
- [ ] Resultados de Tavily visible en ResearchDisplay
- [ ] IA sintetiza respuesta basada en búsqueda
- [ ] Sin errores en Network (/api/chat status 200)

**Tiempo:** 5-8 segundos

---

## 📍 PASO 7: Prueba Creación de Tienda (createStore)

```
ESCRIBE EN EL INPUT:
┌────────────────────────────────────────────┐
│ "Crea una tienda para vender estos termos"│
└────────────────────────────────────────────┘

ESPERADO:
┌────────────────────────────────────────────────┐
│ Me: Crea una tienda para vender termos        │
│                                                │
│ EcomIA: Perfecto, voy a crear tu tienda...   │
│         [⏳ Creando tienda...]                │
│                                                │
│ ✅ ¡Listo el pollo! He creado tu tienda      │
│    "Termos Digitales" exitosamente.          │
│    Ahora vamos a configurarla con productos. │
│                                                │
│ Próximos pasos:                                │
│ 1. Agregar productos                          │
│ 2. Configurar pagos                           │
│ 3. Publicar tienda                            │
└────────────────────────────────────────────────┘
```

**✓ Verificar en DevTools (F12 → Network):**
```
Request: POST /api/chat
Response contiene: "createStore" tool invocation
Status: 200 OK ✅
```

**Nota:**
- Si hay error "Debes iniciar sesión": inicia sesión con un usuario real

**Tiempo:** 3-5 segundos

---

## 📍 PASO 8: Verifica Consola (Limpieza)

```
ABRE DevTools: F12 o Ctrl+Shift+I
PESTAÑA:      Console

BUSCA:
✅ Sin ERRORES rojos ❌
✅ Warnings (amarillo) ⚠️  son OK
   - Deprecation warnings de Next.js normales
   - "middleware convention is deprecated" → OK

EJEMPLO DE CONSOLA OK:
┌──────────────────────────────────────────┐
│ ⚠️  Warning: "middleware is deprecated"  │
│ ⚠️  Warning: "React in strict mode..."   │
│                                          │
│ [No hay errores rojos ❌]               │
│                                          │
│ Status: ✅ Limpia                       │
└──────────────────────────────────────────┘
```

**✓ Checklist:**
- [ ] 0 errores rojos
- [ ] Warnings son esperados
- [ ] Mensajes de debug visibles (opcional)

**Tiempo:** 1 minuto

---

## 📍 PASO 9: Verifica Network Performance

```
ABRE DevTools: F12
PESTAÑA:       Network
ACCIÓN:        Recarga página (Ctrl+F5)

ESPERADO:
┌──────────────────────────────────────┐
│ Request  │ Status │ Size  │ Time    │
├──────────┼────────┼───────┼─────────┤
│ document │  200   │ 30KB  │ 100ms   │
│ _next... │  200   │ 450KB │ 500ms   │
│ globals.│  200   │ 50KB  │ 200ms   │
│ ...     │        │       │         │
├──────────┼────────┼───────┼─────────┤
│ Total    │ Load: 2-4 segundos       │
│          │ Fully Loaded: 4-6s       │
└──────────────────────────────────────┘
```

**MÉTRICAS:**
- DOMContentLoaded: < 2s ✅
- Load: < 4s ✅
- Total Size: < 1MB ✅

**Tiempo:** 1 minuto

---

## 📋 Checklist de Testing Completo

```
✅ FASE 1: Navegación
  ✓ Home page carga
  ✓ Login page accesible

✅ FASE 2: Autenticación
  ✓ Login con usuario real funciona
  ✓ Redirect a /chat sucede

✅ FASE 3: Chat
  ✓ Puedo escribir y enviar mensajes
  ✓ AI responde (2-5 segundos)
  ✓ No hay errores en Network

✅ FASE 4: Herramientas
  ✓ searchMarket busca mercado
  ✓ createStore simula creación
  ✓ Respuestas son coherentes

✅ FASE 5: Calidad
  ✓ Console no tiene errores rojos
  ✓ Network requests todas 200
  ✓ Performance < 4 segundos

RESULTADO FINAL: ✅ LISTO PARA VERCEL
```

---

## 🔥 Si Algo Falla

### Error: "Chat no responde"
```
🔍 Debugea:
1. F12 → Network
2. Envía un mensaje
3. Busca POST /api/chat
4. Status debe ser 200
5. Si es 500: Error en servidor (check terminal)
6. Si no aparece: Problema de conexión
```

### Error: "Cannot find module"
```
🔍 Solución:
1. npm ci
2. npm run dev
```

### Error: "E2BIG: argument list too long"
```
🔍 Solución:
npm run dev
(problema de cache de node_modules)
```

---

## 🚀 Una Vez Que TODO Pase

```bash
# 1. Verifica que los tests pasen
npm test

# 2. Commit cambios
git add .
git commit -m "Testing complete: all checks pass ✅"

# 3. Push a main
git push origin main

# 4. GitHub Actions se ejecutará automáticamente
#    Ve a: https://github.com/tu-repo/actions

# 5. Deploy a Vercel
vercel --prod
```

---

**Tiempo Total de Testing:** 30-45 minutos  
**Status:** ✅ Completo y Exitoso!

¿Necesitas ayuda con algún paso? Avísame! 🚀
