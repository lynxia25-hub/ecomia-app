# Agentes necesarios (flujo profesional)

## Objetivo
Mantener calidad profesional, evitar confusiones y llevar al usuario desde idea hasta tienda/landing publicada con pagos activos.

## Reglas de seguridad (aplican a todos los agentes)
- Nunca pedir contraseñas ni accesos de dominios.
- Tokens y credenciales solo por OAuth o campos cifrados.
- Si falta un dato, responder "dato no disponible".
- No inventar precios ni proveedores.
- Si el usuario sale del tema, redirigir al flujo principal.

## Propuesta de simplificacion (recomendada)
- **Fusionar Research + Recommendation** en un solo agente: "Sourcing & Recomendacion".
- Mantener agentes especializados para contenido (landing/copy/media) y soporte.

Motivo: reduce pasos, evita duplicidad y mejora la coherencia de las respuestas.

---

## Agentes propuestos (minimo viable profesional)

### 1) Orquestador
- **Rol:** decide que agente usar segun la intencion del usuario.
- **Entrada:** mensaje del usuario.
- **Salida:** clave exacta del agente.

### 2) Sourcing & Recomendacion (fusion)
- **Rol:** investigacion de mercado + recomendaciones claras.
- **Responsabilidades:**
  - Buscar tendencias y fuentes reales.
  - Entregar tabla con demanda/competencia/margen/proveedor.
  - Recomendar 1-2 opciones y pedir confirmacion.
- **Calidad:** forzar links reales, no inventar precios.

### 3) Landing Builder
- **Rol:** crear estructura y copy de landing.
- **Salida:** titulo, subtitulo, beneficios, FAQ, CTA.
- **Uso:** se activa cuando el usuario confirma el producto.

### 4) Copy Social
- **Rol:** copys listos para redes sociales.
- **Salida:** Instagram/TikTok/Facebook + hashtags.

### 5) Media Creator
- **Rol:** ideas de imagenes y videos cortos.
- **Salida:** prompts visuales + guiones cortos.

### 6) Fallback Monitor
- **Rol:** diagnosticar fallos y proponer soluciones.
- **Uso:** cuando hay errores o bloqueos.

---

## Flujo recomendado (paso a paso)

1) **Usuario llega y describe idea**
2) **Orquestador** selecciona agente
3) **Sourcing & Recomendacion**:
   - Tabla clara + recomendaciones
   - Pregunta de confirmacion
4) **Confirmacion de producto**
5) **Landing Builder** crea borrador
6) **Edicion guiada** (titulos, CTA, colores, imagen)
7) **Checkout y pagos** (MercadoPago)
8) **Dominio + validacion DNS**
9) **Publicacion con 1 click + SEO/legal**
10) **Listo para vender** (checklist final)

---

## Agentes opcionales (futuro)
- **Pricing Optimizer:** sugiere precio y margen.
- **Brand Kit:** paleta, tipografias, logo base.
- **Support Script:** respuestas frecuentes y soporte.

---

## Notas de calidad
- El usuario siempre debe recibir:
  - una salida clara
  - una recomendacion concreta
  - un "siguiente paso" accionable
- Evitar texto largo y vago.
- Mantener consistencia con fuentes reales.

## Refinamiento continuo
- Fuente de verdad: PROMPTS.md
- Ajustes rapidos en produccion: tabla agent_definitions
