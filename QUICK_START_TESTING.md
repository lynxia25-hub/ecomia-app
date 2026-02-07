# 🔑 Credenciales de Prueba - Acceso Rápido

## ⚡ Para Testing Rápido (RECOMENDADO)

**Método:** Usuario real en Supabase Auth

### ¿Cómo usar?
1. Crea un usuario en Supabase Auth (email + contraseña)
2. Abre http://localhost:3000/login
3. Ingresa tus credenciales
4. Serás redirigido a /chat

---

## 🌐 Servidor Local

```
URL Base:       http://localhost:3000
Home:           http://localhost:3000
Login:          http://localhost:3000/login
Chat:           http://localhost:3000/chat (requiere auth)
API Chat:       http://localhost:3000/api/chat (POST)
```

### Comando para Iniciar
```bash
npm run dev
```

**Esperado:**
```
✓ Ready in 2.4s
- Local: http://localhost:3000
```

---

## 📋 Variables de Entorno Necesarias

Verifica que `.env.local` tiene (luego de correr `node generate-env.js`):
```
NEXT_PUBLIC_SUPABASE_URL=<url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
GROQ_API_KEY=<key>
TAVILY_API_KEY=<key>
```

### ✅ Cómo Verificar
```bash
# Genera .env.local si no existe
node generate-env.js

# Verifica que tiene contenido
cat .env.local

# Debería mostrar:
# NEXT_PUBLIC_SUPABASE_URL=https://...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# etc
```

---

## 🧪 Tests Clave Antes de Vercel

### Test 1: Login
```
1. http://localhost:3000/login
2. Ingresa credenciales reales (Supabase Auth)
3. Enter
4. ✅ Redirect a /chat (sin errores)
```

### Test 2: Chat Básico
```
1. En /chat, escribe: "Hola"
2. Presiona Enter
3. ✅ Respuesta de IA en 2-5 segundos
```

### Test 3: Herramientas IA
```
1. En /chat, escribe: "Quiero vender termos"
2. ✅ IA busca en Tavily (mercado)
3. ✅ Respuesta sintetizada
```

### Test 4: Console Limpia
```
1. F12 → Console
2. No hay errores rojos ❌
3. Hay warnings normales de Next.js ⚠️
4. ✅ Todo OK
```

---

## 🔧 Setup Completo (Si es Primera Vez)

```bash
# 1. Instalar dependencias
npm ci

# 2. Generar variables de entorno
node generate-env.js

# 3. Arranca servidor
npm run dev

# 4. Abre navegador
# http://localhost:3000

# 5. Login con usuario real de Supabase Auth
```

---

## 📞 Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| "Port 3000 already in use" | `lsof -i :3000` luego `kill -9 <PID>` |
| "ERR_MODULE_NOT_FOUND" | Corre `npm ci` |
| "ENOENT: no such file .env.local" | Corre `node generate-env.js` |
| "Cannot POST /api/chat" | Verifica que servidor está corriendo |
| "Login fallido" | Verifica console (F12) para errores |

---

## 🚀 Una Vez que Tests Pasen

```bash
# 1. Commit cambios
git add . && git commit -m "Ready for Vercel"

# 2. Push
git push origin main

# 3. GitHub Actions corre automáticamente

# 4. Si todo pasa, deploy a Vercel
vercel --prod
```

---

**Última actualización:** Febrero 4, 2026  
**Status:** Listo para Testing
