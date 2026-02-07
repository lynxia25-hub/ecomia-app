# EcomIA - Consultor Inteligente de Comercio Electrónico

Una plataforma de IA para ayudar a emprendedores a validar ideas de negocio y crear tiendas exitosas en LATAM.

**Stack:** Next.js 16 • React 19 • Supabase • Groq LLM • Tavily API • Tailwind CSS

## 🚀 Inicio Rápido

### 1. **Instalar dependencias**
```bash
npm ci
```

### 2. **Configurar variables de entorno**

Copia `.env.local.example` a `.env.local` y completa los valores:

```bash
cp .env.local.example .env.local
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

## 🔐 Autenticación & Seguridad

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
- `searchMarket` — Investiga tendencias y competencia en tiempo real
- `createStore` — Crea una tienda en la base de datos

## 📊 Scripts Disponibles

```bash
npm run dev       # Servidor de desarrollo
npm run build     # Build para producción
npm run start     # Inicia servidor de producción
npm run lint      # Ejecuta ESLint
```

## ⚠️ Problemas Conocidos & Próximos Pasos

### Actuales:
- [ ] Actualizar `ai` SDK a versión con mejor type-safety
- [ ] Remover casteos `as any` del código
- [x] Migrar `middleware.ts` a recomendacion de Next.js (`proxy`)
- [ ] Añadir tests automatizados (Jest/Vitest)
- [ ] Configurar CI/CD (GitHub Actions)
- [ ] Mejorar manejo de errores en API

### En Progreso:
- Optimización de performance de chat
- Soporte multi-idioma
- Implementar rastreo de conversaciones

## 🚀 Deployment

### Vercel (Recomendado)
```bash
vercel
```

### Otros (Docker, etc.)
Asegúrate de:
1. Compilar con `npm run build`
2. Setupear variables de entorno en tu plataforma
3. No exponer `generate-env.js` ni `.env.local`

## 📚 Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Groq API Reference](https://console.groq.com/docs)
- [Tavily Search API](https://tavily.com/api)

## 💡 Contribuciones

Si encuentras bugs o tienes mejoras, abre un issue o PR.

---

**Última actualización:** Febrero 4, 2025
