# EcomIA - Consultor Inteligente de Comercio Electrónico

Una plataforma de IA para ayudar a emprendedores a validar ideas de negocio y crear tiendas exitosas en LATAM.

**Stack:** Next.js 16 • React 19 • Supabase • Groq LLM • Tavily API • Tailwind CSS

## 🚀 Inicio Rápido

### 1. **Instalar dependencias**
```bash
npm ci
```

### 2. **Configurar variables de entorno**

Genera archivo `.env.local` con variables de entorno:

```bash
# Opción A: Usar script de generación (solo desarrollo)
node generate-env.js

# Opción B: Copiar plantilla y completar manualmente
cp .env.local.example .env.local
# Edita .env.local con tus valores
```

**Variables requeridas:**
- `NEXT_PUBLIC_SUPABASE_URL` — URL de tu proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Clave anónima de Supabase
- `GROQ_API_KEY` — API key de Groq (obtén en [console.groq.com](https://console.groq.com))
- `TAVILY_API_KEY` — API key de Tavily (obtén en [tavily.com](https://tavily.com))

⚠️ **SEGURIDAD:** Nunca commites `.env.local` a git. El archivo `.gitignore` ya lo protege.

### 3. **Arranca el servidor de desarrollo**
```bash
npm run dev
```

La app estará disponible en `http://localhost:3000`

### 4. **Compilar para producción**
```bash
npm run build
npm run start
```

---

## 🧪 Testing Antes de Producción

### ⚡ Setup Rápido (2 minutos)
```bash
npm ci                  # Instalar deps
node generate-env.js    # Generar .env.local
npm run dev             # Arranca servidor
```

Luego abre: **http://localhost:3000**

### 🔑 Credenciales de Prueba

Usa un usuario real creado en Supabase Auth (email + contraseña o magic link).

### 📚 Guías de Testing Disponibles

**Tres opciones según tu preferencia:**

| Guía | Duración | Contenido | Para Quién |
|------|----------|-----------|-----------|
| [🎯 Quick Start Testing](./QUICK_START_TESTING.md) | 5 min | Credenciales + Setup básico | Testing rápido |
| [🎥 Testing Paso a Paso](./TESTING_STEPS.md) | 30 min | 9 pasos visuales detallados | Visual/Paso a paso |
| [🧪 Guía Completa](./TESTING_GUIDE.md) | 45 min | 7 fases exhaustivas + troubleshooting | Testing profundo |

### ✅ Checklist de Testing

```
✅ FASE 1: Navegación & Rutas
✅ FASE 2: Autenticación (Login/Logout)
✅ FASE 3: Rutas Protegidas
✅ FASE 4: Chat & IA (mensajes, herramientas)
✅ FASE 5: UI/Responsividad
✅ FASE 6: Performance (< 4 seg)
✅ FASE 7: Console Limpia (sin errores)

→ Ver guías arriba para detalles de cada fase
```

---

## 📁 Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rutas públicas (autenticación)
│   ├── (dashboard)/       # Rutas privadas (requieren auth)
│   │   └── chat/          # Interfaz principal del chat
│   └── api/               # API routes (server-side)
│       └── chat/          # Endpoint del agente IA
├── lib/                    # Utilidades compartidas
│   ├── supabase/          # Cliente Supabase (server/client)
│   └── puter/             # Cliente Puter (opcional)
└── components/            # Componentes React
    ├── chat/              # ChatInterface, ChatSidebar, etc.
    └── ui/                # Componentes genéricos
```

## 🔐 Autenticacion & Seguridad

- **Supabase OAuth** — Inicio de sesión con email/redes sociales
- **Middleware protección** — Las rutas privadas requieren autenticación
- **Sin bypass** — Autenticación real en todos los entornos
- **Proxy activo** — La proteccion de rutas usa `proxy.ts` (Next.js 15+)

## 🤖 API del Agente EcomIA

**Endpoint:** `POST /api/chat`

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Quiero vender productos de belleza" }
  ]
}
```

**Herramientas disponibles:**
- `searchMarket` — Investiga tendencias y competencia en tiempo real (Tavily)
- `createStore` — Crea una tienda en la base de datos (Supabase)

## 📊 Scripts Disponibles

```bash
npm run dev              # Servidor de desarrollo
npm run build            # Build para producción
npm run start            # Inicia servidor de producción
npm run lint             # Ejecuta ESLint
npm test                 # Ejecuta Jest tests
npm run test:watch       # Jest en modo watch
npm run test:coverage    # Reporte de cobertura
```

## 🚀 Deployment

### Vercel (Recomendado)

**Una vez que los tests pasen:**

```bash
# 1. Commit cambios
git add . && git commit -m "Ready for Vercel: all tests pass"

# 2. Push a main
git push origin main

# 3. GitHub Actions corre automáticamente (CI/CD pipeline)
# Ve a GitHub → Actions para ver progreso

# 4. Deploy a Vercel
npm install -g vercel
vercel --prod
```

**Vercel configurará automáticamente:**
- Build & Deploy automático en cada push a main
- Variables de entorno vía Vercel Project Settings
- SSL automático
- CDN global

### Otros Deployment (Docker, Self-hosted)
Asegúrate de:
1. Compilar con `npm run build`
2. Setupear variables de entorno en tu plataforma
3. No exponer `generate-env.js` ni `.env.local`

## 📖 Documentación Adicional

- [ROADMAP.md](./ROADMAP.md) — Próximos pasos y mejoras
- [.github/GITHUB_ACTIONS_SETUP.md](./.github/GITHUB_ACTIONS_SETUP.md) — Setup de CI/CD
- [.env.local.example](./.env.local.example) — Variables de entorno requeridas

## 📚 Recursos Externos

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Groq API Reference](https://console.groq.com/docs)
- [Tavily Search API](https://tavily.com/api)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 💡 Contribuciones

Si encuentras bugs o tienes mejoras, abre un issue o PR.

---

**Ultima actualizacion:** Febrero 6, 2026  
**Status:** ✅ Listo para Testing & Producción
