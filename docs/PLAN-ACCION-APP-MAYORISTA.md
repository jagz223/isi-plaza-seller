# Plan de acción — ISI Plaza App 2 (Mayorista / Seller)

**Proyecto:** ID 819 — Directorio App B2B para Mayoristas  
**Repositorio:** `isi-plaza-seller`  
**Stack frontend:** React Native + Expo SDK 55 + Expo Router  
**Backend (existente):** Laravel + panel web administrativo + APIs en desarrollo  
**Última actualización del plan:** Mayo 2026

---

## 1. Contexto del ecosistema

ISI Plaza es un **directorio B2B de generación de leads**. Conecta **compradores** (App 1) con **mayoristas** (App 2) en iOS y Android. No hay pasarela de pagos ni checkout dentro de las apps: la transacción final se cierra por **WhatsApp**, sitio web o redes del mayorista.

| Componente | Rol | Estado (según equipo) |
|------------|-----|------------------------|
| **App 1 — Comprador** | Buscar mayoristas, ver perfiles, guardar favoritos, contactar | Otro repositorio |
| **App 2 — Mayorista (este proyecto)** | Registro, suscripción, perfil/catálogo, métricas, ajustes | En desarrollo (este repo) |
| **Panel web admin** | Gestión de usuarios, acceso post-pago, banners, tokens, verificación | Laravel — implementado |
| **APIs REST** | Autenticación, perfiles, métricas, estados de suscripción | Laravel — en creación |

### Modelo de negocio relevante para App 2

1. El mayorista se **registra** en la app.
2. Llega a la pantalla de **suscripción** (69 MXN/mes indicado en UI).
3. Pulsa **Suscribirme** → se abre **WhatsApp empresarial** (número configurable; ficticio en fase inicial).
4. El pago y acuerdo ocurren **fuera de la app**.
5. El **administrador** habilita el acceso desde el panel → el mayorista puede salir del “muro” de suscripción.
6. El admin activa una **cuenta regresiva de 30 días** desde que se dio acceso.
7. Con acceso activo, el mayorista completa su **perfil** (visible en App 1), consulta **métricas** y gestiona **ajustes**.
8. Banners y renovaciones también se gestionan vía WhatsApp + flags en panel admin.

---

## 2. Alcance exclusivo de App 2 (Mayorista)

Este documento **no** cubre App 1 ni el panel admin, salvo como referencia de datos que el mayorista debe cargar o que el backend expone.

### Pantallas obligatorias (PDF diseño + documentación funcional)

| # | Pantalla | Ruta sugerida (Expo Router) | Acceso |
|---|----------|-----------------------------|--------|
| 1 | Registro / Inicio de sesión | `(auth)/registro` o `(auth)/index` | Público |
| 2 | Suscripción de pago | `(auth)/suscripcion` | Usuario autenticado sin acceso admin |
| 3 | Dar de alta (perfil + catálogo) | `(app)/perfil` | Usuario con `access_granted` |
| 4 | Métricas | `(app)/metricas` | Usuario con acceso |
| 5 | Ajustes | `(app)/ajustes` | Usuario con acceso |

**Navegación principal (post-acceso):** menú inferior con **5 iconos** — Registro no forma parte del tab bar una vez dentro del flujo autenticado con acceso; el PDF de diseño muestra tabs para Suscripción (bloqueada hasta acceso), Dar de alta, Métricas y Ajustes. En la práctica, tras el acceso del admin, el flujo habitual será: **Dar de alta | Métricas | Ajustes** (+ posible tab o estado de suscripción solo mientras esté pendiente).

> **Nota de flujo:** Mientras el admin no otorgue acceso, el mayorista debe permanecer en **Suscripción de pago** sin poder avanzar a las demás secciones.

---

## 3. Sistema de diseño (PDF ID 819 — App 2)

### Paleta base

| Token | Hex | Uso propuesto |
|-------|-----|---------------|
| Blanco | `#FFFFFF` | Fondos principales, tarjetas |
| Negro | `#000000` | Texto principal, iconos |
| Rojo primario | `#FF0000` | CTAs principales, acentos de marca |
| Rojo medio | `#FF4040` | Hover / estados secundarios |
| Rojo oscuro | `#E00000` | Bordes activos, énfasis |
| Rojo claro | `#FF7676` | Fondos suaves, badges |

### Acciones de implementación

- [ ] Definir tokens en `src/constants/theme.ts` (o tema dedicado `src/constants/isi-plaza.ts`).
- [ ] Actualizar `app.json` (splash, adaptive icon) para alinear con marca ISI Plaza cuando existan assets finales.
- [ ] Incorporar **logo** centrado en pantalla de registro (carpeta Drive del proyecto o assets locales).
- [ ] Tipografía y espaciado: seguir guías visuales del PDF de diseño al maquetar cada pantalla.

### Recursos externos

- Logo y pantallas de carga App 1 (referencia de marca): [Google Drive — assets ID 819](https://drive.google.com/drive/folders/1f4ZwhtiZEg6rUpQlw6nv4EA_LgSwnSvu?usp=sharing)

---

## 4. Especificación detallada por pantalla

### 4.1 Registro (Acceso de usuario)

**Objetivo:** Alta de cuenta e inicio de sesión para mayoristas.

| Elemento | Requisito |
|----------|-----------|
| Logo | Centrado en la parte superior |
| Título registro | Texto: **¡Registrate!** |
| Campos registro | Nombre, Mail, Contraseña (6–14 caracteres), Confirmar contraseña |
| CTA registro | Botón **Registrarme** |
| Separador visual | Texto **Inicia sesión** |
| Campos login | Correo, Contraseña |
| CTA login | Botón **Iniciar Sesión** |
| Recuperación | Botón **Recuperar contraseña del correo ingresado** |

**Validaciones frontend:**

- Email con formato válido.
- Contraseña entre 6 y 14 caracteres.
- Confirmación de contraseña coincidente.
- Mensajes de error claros (API + validación local).

**Integración API (esperada):**

- `POST /api/wholesaler/register` — nombre, email, password
- `POST /api/wholesaler/login` — email, password → token JWT/Sanctum
- `POST /api/wholesaler/forgot-password` — email

**Criterios de aceptación:**

- Tras registro exitoso → redirigir a **Suscripción de pago**.
- Tras login → si sin acceso admin → **Suscripción**; si con acceso → **Dar de alta** o última pantalla permitida.

---

### 4.2 Suscripción de pago

**Objetivo:** Informar el plan y canalizar al WhatsApp; bloquear el resto de la app hasta aprobación admin.

| Elemento | Requisito |
|----------|-----------|
| Texto | **Suscripción mensual de 69 mxn** |
| CTA | Botón **Suscribirme** → deep link / URL de WhatsApp |
| Bloqueo | No navegar a Dar de alta / Métricas / Ajustes si `subscription_access === false` |

**WhatsApp (fase 1):**

- Número ficticio configurable vía variable de entorno, ej. `EXPO_PUBLIC_WHATSAPP_SALES=521XXXXXXXXXX`.
- Mensaje prellenado sugerido: *"Hola, quiero suscribirme al plan mayorista ISI Plaza (69 MXN/mes)."*

**Integración API (esperada):**

- `GET /api/wholesaler/me` — incluye flags: `has_access`, `subscription_expires_at`, estado de suscripción.
- Polling o refresh al volver a la app para detectar cuando el admin habilitó acceso.

**Criterios de aceptación:**

- Usuario sin acceso solo ve esta pantalla (y puede cerrar sesión si se expone desde aquí o desde ajustes bloqueados).
- Al detectar `has_access === true` → navegar al stack principal con tabs.

---

### 4.3 Dar de alta (Perfil mayorista)

**Objetivo:** Capturar toda la información que los compradores verán en App 1.

Texto superior centrado: **Esta es la información que verán los usuarios**.

La documentación indica replicar los campos visibles en el **perfil de mayorista de App 1**. Desglose funcional:

#### Datos del perfil (vista comprador — App 1)

| Campo / sección | Descripción | Notas UI |
|-----------------|-------------|----------|
| Fotos carrusel superior | Varias imágenes en carrusel del perfil | Subida múltiple, orden, preview |
| Nombre comercial | Visible junto al carrusel | Texto |
| Descripción | Texto bajo etiqueta "Descripción" | ~100 caracteres en spec de ejemplo; confirmar límite con backend |
| WhatsApp | Botón "enviar mensaje" en App 1 | Número o enlace wa.me |
| Instagram | Enlace | URL o usuario |
| Facebook | Enlace | URL |
| Página web | Enlace | URL |
| Catálogo | **5 carruseles**, cada uno con imágenes | Entrada para añadir imágenes por carrusel |

#### Datos adicionales inferidos (listado y filtros App 1)

Para aparecer correctamente en búsquedas de compradores, el backend probablemente requerirá también:

| Campo | Origen en spec App 1 |
|-------|----------------------|
| Categoría / tipo de mayorista | Grid 2×5 (Tecnología, Ropa, Alimentos, etc.) |
| País | Lista de países latinoamérica + China |
| Estado / provincia | Depende del país seleccionado |
| Foto de perfil (thumbnail en listado) | Tarjeta 2 columnas: foto, nombre, descripción corta |

> **Acción:** Validar con el equipo de backend el contrato exacto del endpoint de perfil antes de implementar formularios definitivos.

**Integración API (esperada):**

- `GET /api/wholesaler/profile` — obtener borrador o perfil publicado
- `PUT` o `POST /api/wholesaler/profile` — guardar datos
- `POST /api/wholesaler/profile/images` — subida de imágenes (multipart)
- `DELETE /api/wholesaler/profile/images/{id}` — eliminar imagen de carrusel

**Criterios de aceptación:**

- Formulario usable en iOS y Android (scroll, teclado, permisos de galería/cámara).
- Guardado exitoso reflejado en App 1 tras publicación (depende de backend).
- Validación de URLs y campos obligatorios antes de enviar.

---

### 4.4 Métricas

**Objetivo:** Mostrar interacciones de compradores con el perfil del mayorista.

| Elemento | Requisito |
|----------|-----------|
| Título | Alineado arriba a la derecha: **Métricas de tu perfil en la aplicación de usuarios** |
| Métrica 1 | Usuarios que han clickeado tu perfil el último mes: `{n}` |
| Métrica 2 | Usuarios que han clickeado tu whatsapp último mes: `{n}` |

**Integración API (esperada):**

- `GET /api/wholesaler/metrics?period=last_month` — `profile_clicks`, `whatsapp_clicks`

**Criterios de aceptación:**

- Números dinámicos desde API (los valores 20 y 10 del PDF son solo ejemplo).
- Estado vacío y error de red manejados.

---

### 4.5 Ajustes (Opciones de cuenta)

**Objetivo:** Suscripción, promociones, contraseña y cierre de sesión.

| Elemento | Requisito |
|----------|-----------|
| Título | Centrado: **Opciones De Tu Cuenta** |
| Suscripción | Texto: **Tu suscripción acaba el día [fecha]** — fecha desde backend (`subscription_expires_at`) |
| Promoción banners | Botón → WhatsApp (número ficticio en fase 1) |
| Cerrar sesión | Botón **Log out** |
| Contraseña | Campos para cambiar contraseña (actual, nueva, confirmar) |

**Integración API (esperada):**

- `GET /api/wholesaler/me` — fecha fin de suscripción
- `PUT /api/wholesaler/password` — cambio de contraseña
- `POST /api/wholesaler/logout` — invalidar token (si aplica)

**Criterios de aceptación:**

- Formato de fecha legible en español (ej. *14 de mayo de 2026*).
- Logout limpia token y redirige a Registro.

---

## 5. Arquitectura de navegación propuesta

```
src/app/
├── _layout.tsx                 # Root: providers, fuentes, splash
├── index.tsx                   # Redirect según auth + access
├── (auth)/
│   ├── _layout.tsx
│   ├── registro.tsx            # Registro + login + recuperar
│   └── suscripcion.tsx         # Pantalla bloqueada pre-acceso
└── (app)/
    ├── _layout.tsx             # Native tabs (3–4 tabs según diseño final)
    ├── perfil.tsx              # Dar de alta
    ├── metricas.tsx
    └── ajustes.tsx
```

### Guard de rutas (lógica)

```
if (!token) → (auth)/registro
else if (!has_access) → (auth)/suscripcion
else → (app)/*
```

Implementar con **Expo Router** + contexto `AuthProvider` o similar, hidratando estado desde `SecureStore` / `expo-secure-store`.

---

## 6. Capas técnicas del frontend

### 6.1 Estructura de carpetas sugerida

```
src/
├── app/                    # Rutas (Expo Router)
├── components/
│   ├── ui/                 # Button, Input, Card
│   └── seller/             # Formularios perfil, métricas
├── constants/
│   └── isi-plaza.ts        # Colores marca, WhatsApp, límites
├── hooks/
│   ├── use-auth.ts
│   └── use-wholesaler-profile.ts
├── services/
│   └── api/
│       ├── client.ts       # axios/fetch + interceptors
│       ├── auth.ts
│       ├── profile.ts
│       └── metrics.ts
├── types/
│   └── wholesaler.ts
└── utils/
    ├── validation.ts
    └── whatsapp.ts
```

### 6.2 Dependencias recomendadas (a incorporar progresivamente)

| Paquete | Propósito |
|---------|-----------|
| `expo-secure-store` | Persistir token de sesión |
| `expo-image-picker` | Fotos de perfil y catálogo |
| `expo-linking` | Abrir WhatsApp |
| `react-hook-form` + `zod` | Formularios y validación |
| `@tanstack/react-query` | Cache y estados de API |
| `axios` o `fetch` nativo | Cliente HTTP |

### 6.3 Variables de entorno

```env
EXPO_PUBLIC_API_URL=https://api.ejemplo.com
EXPO_PUBLIC_WHATSAPP_SALES=521XXXXXXXXXX
EXPO_PUBLIC_WHATSAPP_BANNERS=521XXXXXXXXXX
```

---

## 7. Contrato API — checklist para coordinación con backend

Documentar y acordar con el equipo Laravel **antes** de cerrar cada pantalla:

| # | Endpoint (propuesto) | Método | Pantalla |
|---|----------------------|--------|----------|
| 1 | `/wholesaler/register` | POST | Registro |
| 2 | `/wholesaler/login` | POST | Login |
| 3 | `/wholesaler/forgot-password` | POST | Recuperar |
| 4 | `/wholesaler/me` | GET | Suscripción, Ajustes, Guard |
| 5 | `/wholesaler/profile` | GET/PUT | Dar de alta |
| 6 | `/wholesaler/profile/images` | POST/DELETE | Catálogo / carruseles |
| 7 | `/wholesaler/metrics` | GET | Métricas |
| 8 | `/wholesaler/password` | PUT | Ajustes |

**Campos críticos en `/wholesaler/me`:**

- `has_access` (boolean) — admin habilitó pasar suscripción
- `subscription_expires_at` (ISO date)
- `is_verified` (boolean) — palomita azul (gestionada en admin, solo lectura en app)
- `has_active_promotion` (boolean) — banner pagado

---

## 8. Plan de implementación por fases

### Fase 0 — Fundamentos (actual → 1 semana)

- [x] Proyecto Expo inicializado (`isi-plaza-seller`)
- [ ] Aplicar paleta ISI Plaza y tema global
- [ ] Configurar estructura de carpetas y alias `@/`
- [ ] Cliente API base + variables de entorno
- [ ] `AuthProvider` + persistencia de token
- [ ] Guards de navegación (auth / access)

### Fase 1 — Autenticación (1–2 semanas)

- [ ] UI **Registro** según PDF (registro + login + recuperar)
- [ ] Integración endpoints de auth (cuando estén listos)
- [ ] UI **Suscripción de pago** + deep link WhatsApp
- [ ] Pantalla bloqueada hasta `has_access`
- [ ] Pruebas en emulador Android / iOS

### Fase 2 — Perfil “Dar de alta” (2–3 semanas)

- [ ] Maquetación formulario completo
- [ ] Selector categoría, país, estado/provincia
- [ ] Subida de imágenes (perfil, carrusel superior, 5 carruseles de catálogo)
- [ ] Integración CRUD perfil con API
- [ ] Estados: guardando, error, éxito

### Fase 3 — Métricas y Ajustes (1 semana)

- [ ] Pantalla **Métricas** con datos reales
- [ ] Pantalla **Ajustes**: fecha suscripción, WhatsApp banners, cambio contraseña, logout
- [ ] Tab bar final con iconografía del PDF

### Fase 4 — Calidad y entrega (1 semana)

- [ ] Manejo offline / errores de red
- [ ] Accesibilidad básica (labels, contraste con paleta rojo/blanco)
- [ ] Pruebas en dispositivos físicos
- [ ] Build EAS (preview / production)
- [ ] Documentación de despliegue y `.env.example`

---

## 9. Matriz de trazabilidad (requisito → entregable)

| ID | Requisito (documentación) | Entregable frontend |
|----|---------------------------|---------------------|
| R1 | Registro con nombre, mail, contraseña 6–14 | `(auth)/registro.tsx` + validación |
| R2 | Login y recuperar contraseña | Misma pantalla + API |
| R3 | Suscripción 69 MXN + WhatsApp | `(auth)/suscripcion.tsx` + `Linking` |
| R4 | Bloqueo hasta acceso admin | Navigation guard + `/me` |
| R5 | Perfil visible en App 1 | `(app)/perfil.tsx` + uploads |
| R6 | 5 carruseles de catálogo | Componente multi-carrusel + API imágenes |
| R7 | Métricas clicks perfil / WhatsApp | `(app)/metricas.tsx` |
| R8 | Fecha fin suscripción, banners WA, logout, password | `(app)/ajustes.tsx` |
| R9 | Menú inferior con iconos | `(app)/_layout.tsx` Native Tabs |
| R10 | Paleta de colores PDF | `isi-plaza.ts` + estilos globales |

---

## 10. Riesgos y dependencias

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| APIs aún en desarrollo | Bloquea integración | Mocks locales + contrato OpenAPI acordado |
| Definición incompleta de campos de perfil | Retrabajo en formulario | Reunión de alineación con backend y App 1 |
| Límites de tamaño de imágenes no especificados | Fallos de subida | Preguntar al admin panel / backend |
| Sin assets de logo finales | UI incompleta | Placeholder + carpeta Drive |
| Reglas de provincias por país | Datos maestros | Endpoint catálogo geográfico o JSON estático v1 |

---

## 11. Definición de “hecho” (Definition of Done)

Una pantalla se considera **terminada** cuando:

1. Coincide con el PDF de diseño (layout, textos, colores).
2. Está conectada a la API real o mock documentado.
3. Maneja loading, error y estados vacíos.
4. Funciona en Android e iOS (o se documenta limitación web si aplica).
5. Pasa revisión de flujo con reglas de negocio (ej. bloqueo de suscripción).
6. No introduce regresiones en navegación ni almacenamiento de sesión.

---

## 12. Próximos pasos inmediatos

1. **Confirmar URL base de API** y esquema de autenticación (Sanctum/JWT).
2. **Obtener mockups detallados** de cada una de las 5 pantallas del PDF `ID 819 (APP 2).pdf` (el extracto de texto solo incluye paleta y estructura; las capturas visuales deben guiar el pixel-perfect).
3. **Implementar Fase 0 y Fase 1** en este repositorio.
4. **Sincronizar con App 1** el modelo de datos del perfil de mayorista para garantizar paridad.

---

## Referencias

- Documentación funcional: `Información Del Proyecto ID 819.pdf`
- Diseño UI App 2: `ID 819 (APP 2).pdf`
- Expo SDK 55: https://docs.expo.dev/versions/v55.0.0/
- Assets de marca: [Google Drive](https://drive.google.com/drive/folders/1f4ZwhtiZEg6rUpQlw6nv4EA_LgSwnSvu?usp=sharing)
