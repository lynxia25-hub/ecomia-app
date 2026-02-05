# 🔒 Plan de Acción de Seguridad - EcomIA

## ⚠️ ALERTA CRÍTICA

Este repositorio contiene **credenciales expuestas** que deben ser rotadas inmediatamente.

---

## 🚨 Acción Inmediata Requerida

### Paso 1: Rotar API Keys (AHORA)

#### Supabase
1. Ir a: https://supabase.com/dashboard/project/qvmptfyzflqcrhbnenux/settings/api
2. Regenerar `anon` key
3. Actualizar `service_role` key (si está en uso)
4. Nota: Los usuarios existentes seguirán funcionando

#### Groq
1. Ir a: https://console.groq.com/keys
2. Crear nueva API key
3. Eliminar key antigua: `gsk_tUo5WwzSbl59HjM36CVa...`

#### Tavily
1. Ir a: https://app.tavily.com/api-keys
2. Generar nueva key
3. Revocar key antigua: `tvly-dev-eHHA0ClbnVOT...`

### Paso 2: Eliminar Archivo Comprometido

```bash
# En tu terminal local (no en este ambiente)
cd /path/to/ecomia-app

# Remover el archivo del repositorio
git rm generate-env.js

# Commit el cambio
git commit -m "security: remove exposed API keys file"

# Push
git push origin main

# IMPORTANTE: Esto NO elimina del historial de Git
# Ver "Paso 3" para limpieza completa
```

### Paso 3: Limpiar Historial de Git (Opcional pero Recomendado)

⚠️ **ADVERTENCIA:** Esto reescribe el historial de Git. Coordina con tu equipo.

```bash
# Usar git-filter-repo (más seguro que filter-branch)
# Instalar: pip install git-filter-repo

# Backup del repositorio primero
cp -r ecomia-app ecomia-app-backup

# Eliminar archivo del historial
git filter-repo --path generate-env.js --invert-paths

# Force push (solo si todos los colaboradores están informados)
git push origin --force --all
```

**Alternativa más simple (si no hay colaboradores):**
1. Crear nuevo repositorio en GitHub
2. Clonar este repo localmente
3. Eliminar `.git` folder
4. `git init` de nuevo
5. Push al nuevo repositorio

### Paso 4: Configurar Variables de Entorno Correctamente

#### Crear Plantilla `.env.example`

```bash
# Crear archivo de ejemplo (SIN valores reales)
cat > .env.example << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# AI Services
GROQ_API_KEY=gsk_your_groq_api_key_here
TAVILY_API_KEY=tvly_your_tavily_api_key_here

# Optional
OPENAI_API_KEY=sk_your_openai_key_here
EOF
```

#### Configurar Localmente

```bash
# Copiar plantilla
cp .env.example .env.local

# Editar con nuevas keys (usa nano, vim, o tu editor favorito)
nano .env.local

# .env.local ya está en .gitignore, verificar:
grep ".env" .gitignore
```

#### Configurar en Vercel (Producción)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Link al proyecto
vercel link

# Agregar secretos
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add GROQ_API_KEY
vercel env add TAVILY_API_KEY

# Re-deployar
vercel --prod
```

O vía Dashboard:
1. Ir a: https://vercel.com/tu-proyecto/settings/environment-variables
2. Agregar cada variable
3. Aplicar a: Production, Preview, Development

---

## 🔐 Seguridad del Bypass de Auth

### Problema Actual

```typescript
// ❌ INSEGURO: Credenciales hardcodeadas
if (email === "admin@ecomia.com" && password === "admin123") {
  cookies().set("ecomia_bypass", "true", { httpOnly: true })
}
```

### Solución 1: Eliminar en Producción

```typescript
// src/app/actions/auth-bypass.ts
'use server'

import { cookies } from 'next/headers'

export async function handleBypass(email: string, password: string) {
  // 🔒 Solo permitir en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return { success: false, message: 'Not available in production' }
  }

  if (
    email === process.env.DEV_ADMIN_EMAIL &&
    password === process.env.DEV_ADMIN_PASSWORD
  ) {
    cookies().set('ecomia_bypass', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 horas
    })
    
    return { success: true }
  }

  return { success: false }
}
```

Agregar a `.env.local`:
```bash
DEV_ADMIN_EMAIL=admin@ecomia.com
DEV_ADMIN_PASSWORD=tu_password_seguro_aqui
```

### Solución 2: Feature Flag (Recomendado)

```typescript
// lib/feature-flags.ts
export const featureFlags = {
  enableAuthBypass: process.env.ENABLE_AUTH_BYPASS === 'true',
}

// src/app/actions/auth-bypass.ts
import { featureFlags } from '@/lib/feature-flags'

export async function handleBypass(email: string, password: string) {
  if (!featureFlags.enableAuthBypass) {
    throw new Error('Feature disabled')
  }
  
  // resto del código...
}
```

En Vercel:
- Development: `ENABLE_AUTH_BYPASS=true`
- Production: `ENABLE_AUTH_BYPASS=false` (o no setear)

---

## 🛡️ Checklist de Seguridad Completo

### Autenticación & Autorización
- [ ] API keys rotadas
- [ ] `generate-env.js` eliminado del repo
- [ ] Variables de entorno en Vercel configuradas
- [ ] Bypass de auth protegido con feature flag
- [ ] Middleware validando sesiones correctamente
- [ ] Refresh tokens implementados
- [ ] CSRF protection habilitado

### Input Validation
- [ ] Zod schemas para API routes
- [ ] Sanitización de inputs del usuario
- [ ] Validación de file uploads (si aplica)
- [ ] Rate limiting en endpoints públicos
- [ ] Max length en mensajes de chat (5000 chars)

### Base de Datos
- [ ] Row Level Security (RLS) policies en Supabase
- [ ] Foreign keys en todas las relaciones
- [ ] Índices en columnas frecuentes
- [ ] Soft delete implementado
- [ ] Backup automático configurado

### API & Endpoints
- [ ] CORS configurado correctamente
- [ ] Rate limiting por IP
- [ ] Request size limits
- [ ] Timeout en llamadas externas
- [ ] Error messages sin información sensible

### Configuración
- [ ] `httpOnly` cookies para auth
- [ ] `secure` flag en producción
- [ ] `sameSite` configurado
- [ ] CSP headers configurados
- [ ] HSTS habilitado

### Código
- [ ] No console.log en producción
- [ ] Secrets en .env (nunca en código)
- [ ] Dependencies actualizadas
- [ ] Vulnerabilidades de npm audit resueltas
- [ ] Code review antes de merge

### Monitoreo
- [ ] Error tracking (Sentry/similar)
- [ ] Logging estructurado
- [ ] Alertas de seguridad configuradas
- [ ] Auditoría de accesos
- [ ] Monitoreo de API usage

---

## 📊 Matriz de Riesgo Actual

| Vulnerabilidad | Severidad | Probabilidad | Riesgo | Status |
|----------------|-----------|--------------|--------|--------|
| API Keys en repo | Alta | Alta | 🔴 Crítico | Pendiente |
| Bypass hardcodeado | Media | Media | 🟠 Alto | Pendiente |
| Sin validación input | Media | Alta | 🟠 Alto | Pendiente |
| Console.log en prod | Baja | Alta | 🟡 Medio | Pendiente |
| Sin RLS en Supabase | Alta | Media | 🟠 Alto | Pendiente |
| Sin rate limiting | Media | Media | 🟡 Medio | Pendiente |

---

## 🔄 Post-Remediación

### Verificación

```bash
# 1. Clonar repo fresco
git clone https://github.com/lynxia25-hub/ecomia-app.git fresh-clone
cd fresh-clone

# 2. Buscar secretos
grep -r "gsk_" .
grep -r "supabase" .
grep -r "tvly-" .

# Debe retornar: sin resultados (excepto en .env.example)

# 3. Instalar deps
npm install

# 4. Configurar .env.local con NUEVAS keys
cp .env.example .env.local
nano .env.local

# 5. Probar build
npm run build

# 6. Correr dev
npm run dev

# 7. Probar login
# Ir a http://localhost:3000/login
# Intentar login con bypass (debe fallar en prod)
```

### Comunicación al Equipo

**Template de Email:**

```
Asunto: [URGENTE] Rotación de API Keys - EcomIA

Equipo,

Por seguridad, hemos rotado todas las API keys del proyecto:
- Supabase
- Groq
- Tavily

Acción requerida:
1. Pull últimos cambios: git pull origin main
2. Actualizar .env.local con nuevas keys (ver .env.example)
3. NO commitear archivos .env
4. Verificar que tu entorno local funcione

Las nuevas keys están en:
- Vercel Dashboard > Settings > Environment Variables
- [Compartir de forma segura, e.g., 1Password]

Si tienen dudas, por favor contactar.

Gracias,
[Tu nombre]
```

---

## 📚 Recursos de Seguridad

### Herramientas Recomendadas

- **Secret Scanning:** [TruffleHog](https://github.com/trufflesecurity/trufflehog)
- **Dependency Check:** `npm audit`, [Snyk](https://snyk.io/)
- **Code Analysis:** [SonarQube](https://www.sonarqube.org/)
- **Git History Clean:** [git-filter-repo](https://github.com/newren/git-filter-repo)

### Prevención Futura

```bash
# Pre-commit hook para detectar secretos
npm install --save-dev husky
npx husky install

# Agregar hook
npx husky add .husky/pre-commit "npm run check-secrets"
```

```json
// package.json
{
  "scripts": {
    "check-secrets": "git diff --cached --name-only | xargs grep -i 'api[_-]key\\|secret\\|password' && exit 1 || exit 0"
  }
}
```

### Guías
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [Next.js Security](https://nextjs.org/docs/pages/building-your-application/configuring/content-security-policy)

---

## ✅ Cierre

Una vez completados todos los pasos:

1. ✅ Todas las keys rotadas
2. ✅ `generate-env.js` eliminado
3. ✅ `.env.example` creado
4. ✅ Vercel env vars configuradas
5. ✅ Auth bypass protegido
6. ✅ Build exitoso con nuevas keys
7. ✅ Equipo notificado

**Proyecto puede considerarse seguro.**

---

**Última actualización:** 2026-02-05  
**Próxima revisión:** 2026-03-05 (mensual)
