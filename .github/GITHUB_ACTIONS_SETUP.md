# GitHub Actions & CI/CD Configuration

## 🔐 Required GitHub Secrets

Para que los workflows de GitHub Actions funcionen correctamente, debes configurar los siguientes secrets en tu repositorio:

### Acceso a los Secrets
1. Ve a `Configuración (Settings)` del repositorio
2. Selecciona `Secrets and variables` → `Actions`
3. Clic en `New repository secret`

### Secrets Requeridos

#### Para CI/CD (Pruebas y Build)
```
NEXT_PUBLIC_SUPABASE_URL      # Tu URL de Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY # Tu clave anónima de Supabase
GROQ_API_KEY                   # (Opcional) API key de Groq
TAVILY_API_KEY                 # (Opcional) API key de Tavily
```

#### Para Despliegue en Vercel (Opcional)
```
VERCEL_TOKEN                   # Token de Vercel (obtén en https://vercel.com/account/tokens)
VERCEL_ORG_ID                  # ID de tu organización en Vercel
VERCEL_PROJECT_ID              # ID de tu proyecto en Vercel
```

## 📋 Workflows Disponibles

### 1. **CI/CD Pipeline** (`.github/workflows/ci-cd.yml`)
Se ejecuta automáticamente en cada push a `main` o `develop` y en cada PR.

**Pasos:**
- ✅ Lint & Format Check (ESLint)
- ✅ TypeScript Type Check
- ✅ Run Tests (Jest)
- ✅ Build Next.js
- ✅ Security Audit

**Duración:** ~3-5 minutos

### 2. **Deploy to Vercel** (`.github/workflows/deploy-vercel.yml`)
Se ejecuta automáticamente después de que CI/CD pase en la rama `main`.

**Requisitos:**
- Secrets de Vercel configurados
- Proyecto de Vercel creado

## 🚀 Setup Rápido de Vercel (Si deseas desplegar)

### 1. Crear proyecto en Vercel
```bash
npm install -g vercel
vercel --prod
```

### 2. Obtener secrets de Vercel
```bash
vercel env pull .env.local
```

### 3. Adicionar secrets a GitHub
1. Ve a Settings → Secrets → Actions
2. Copia los valores de:
   - `VERCEL_TOKEN` desde https://vercel.com/account/tokens
   - `VERCEL_ORG_ID` desde tu dashboard
   - `VERCEL_PROJECT_ID` desde settings de tu proyecto

## 📊 Monitoreo de Workflows

1. Ve a la pestaña **Actions** de tu repositorio en GitHub
2. Visualiza el estado de cada workflow
3. Haz clic en un workflow para ver logs detallados

## 🔧 Troubleshooting

### "Workflow failed"
- Revisa los logs en Actions → [Nombre del workflow]
- Verifica que todos los secrets estén configurados
- Asegúrate de que las variables de entorno tengan valores válidos

### "Build failed during CI/CD"
- Ejecuta `npm run build` localmente para reproducir el error
- Asegúrate de que `npm test` pasa
- Verifica que `npm run lint` no tiene errores

### "Deployment to Vercel failed"
- Verifica que `VERCEL_TOKEN`, `VERCEL_ORG_ID`, y `VERCEL_PROJECT_ID` estén configurados
- Comprueba que el nombre del proyecto en Vercel coincida con el esperado
- Revisa los logs en Vercel dashboard

## 📝 Personalización de Workflows

Puedes editar los archivos `.yml` para:
- Agregar más pasos
- Cambiar las ramas donde se ejecutan
- Modificar los comandos que se corren
- Agregar notificaciones (Slack, Discord, etc.)

Ejemplo: Para agregar notificación a Slack después del deploy:
```yaml
- name: Notify Slack
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {"text": "Deployment successful! ✅"}
```

---

**Última actualización:** Febrero 4, 2025
