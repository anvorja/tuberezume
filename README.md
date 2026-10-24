# TubeRezume

Pega un enlace de YouTube y quédate con lo esencial. TubeRezume muestra la transcripción del video, un resumen con puntos clave y capítulos que saltan al minuto exacto, y lo guarda en una biblioteca.

Este repositorio es **solo el frontend**. El backend (transcripción, resumen y base de datos) vive aparte, en el repositorio `tuberezume-service`, y se conecta por HTTP. Sin backend, la app corre con un simulador local para poder verla y desarrollar.

## Qué incluye

- **Landing:** hero con el campo de enlace, cómo funciona, un resumen de ejemplo, muestra de biblioteca y cierre.
- **Aplicación (`/app`):**
  - nuevo resumen con validación del enlace y botón de pegar desde el portapapeles;
  - pantalla de procesamiento en tres etapas (enlace, transcripción, resumen);
  - biblioteca con búsqueda y filtros;
  - vista de resumen con pestañas Resumen, Capítulos y Transcripción buscable, y un botón **Copiar** que copia la pestaña abierta (resumen, capítulos o transcripción) como texto plano;
  - eliminar un resumen con un diálogo de confirmación que muestra el título del video, no borra con un clic fuera, y si el servidor falla se queda abierto con el motivo y permite reintentar;
  - ajustes (tema, búsqueda web y conexión con el backend).
- **Móvil primero:** barra de pestañas inferior en móvil y menú lateral en escritorio.
- **Tema oscuro (por defecto) y claro.**
- **Accesibilidad de movimiento:** respeta `prefers-reduced-motion`.
- **Interfaz en español**, sin sistema de traducciones.

## Concepto visual

El producto convierte miles de palabras en un resumen, y esa idea es la animación: las fibras (la transcripción) se recogen hasta dejar un solo hilo lime (el resumen). En la landing lo recoge el scroll; al procesar un video lo recoge el avance real del backend. El efecto es un canvas 2D propio (`src/components/fx/fiber-field.tsx`), inspirado en el estilo de reactbits pero escrito desde cero.

## Stack

- React 19, TypeScript, Vite
- Tailwind CSS v4
- GSAP, ScrollTrigger y `@gsap/react`
- React Router, Radix UI, Sonner, lucide-react
- Tipografías: Bricolage Grotesque, Geist y Geist Mono (autoalojadas con Fontsource)
- pnpm

## Empezar

Requisitos: Node 20 o superior y [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev
```

Abre la URL que muestra Vite. Scripts disponibles:

| Comando          | Qué hace                              |
| ---------------- | ------------------------------------- |
| `pnpm dev`       | Servidor de desarrollo                |
| `pnpm build`     | Typecheck y build de producción       |
| `pnpm preview`   | Sirve el build localmente             |
| `pnpm typecheck` | Solo comprobación de tipos            |
| `pnpm lint`      | ESLint                                |
| `pnpm format`    | Prettier sobre los `.ts` y `.tsx`     |

## Conectar el backend

La app habla con el backend a través de `src/lib/api.ts`. El backend vive en `../backend_rezume`.

Hay dos formas de indicar dónde está, y la segunda es la que sirve para un frontend desplegado:

1. **Variable de entorno (desarrollo local):** crea `.env.local` (ignorado por git) con `VITE_API_URL=http://localhost:8000` y reinicia `pnpm dev`.
2. **Ajustes de la app:** en **Ajustes → Conexión con el backend** escribe la dirección del servidor y la clave de acceso. Se guardan solo en el `localStorage` del navegador y tienen prioridad sobre `VITE_API_URL`. Es lo que permite que la web desplegada apunte a un backend local expuesto con un túnel (ngrok), cuya URL cambia en cada arranque.

El backend exige la cabecera `Authorization: Bearer <clave>` cuando tiene `API_TOKEN` definido. Cada petición también envía `ngrok-skip-browser-warning`, sin la cual el plan gratuito de ngrok devuelve una página HTML en lugar de JSON. Además, **Ajustes → Búsqueda web** hace que el backend complete el resumen con contexto de la web; las fuentes usadas se muestran al final de la pestaña Resumen.

Contrato que usa el frontend (el backend lo implementa):

| Método y ruta           | Cuerpo                                   | Respuesta                      |
| ----------------------- | ---------------------------------------- | ------------------------------ |
| `POST /summaries`       | `{ "url": "…", "webSearch": true }`      | `Summary` recién creado        |
| `GET /summaries`        |                                          | `Summary[]`                    |
| `GET /summaries/:id`    |                                          | `Summary`                      |
| `DELETE /summaries/:id` |                                          | `204` sin cuerpo               |

En caso de error, el frontend lee `message` del JSON de la respuesta para mostrarlo. El tipo `Summary` está en `src/lib/types.ts`; `status` va de `queued` a `transcribing`, `summarizing` y `ready` (o `failed`), con `progress` de 0 a 1. Mientras haya resúmenes en proceso, el frontend consulta `GET /summaries/:id` cada 1,2 s.

> Todo lo que lleva el prefijo `VITE_` queda dentro del bundle y es visible para cualquiera. No pongas ahí claves ni secretos; la clave de acceso se escribe en Ajustes, no en el código.

### Modo simulado

Sin conexión configurada, la app usa un simulador que guarda en `localStorage` y recorre las etapas por tiempo. Los resúmenes de videos nuevos son **texto de demostración**, no contenido real del video. Los tres resúmenes iniciales (`src/lib/seed.ts`) están escritos a mano, marcados como "Ejemplo" en la interfaz, y conviene quitarlos o reemplazarlos al integrar el backend.

## Estructura

```
src/
  pages/        landing, app-home, library, summary-page, settings
  components/
    fx/         FiberField (canvas con GSAP)
    ui/         botón y primitivas
    brand/      logo
    ...         composer, processing, summary-body, video-card, app-shell
  lib/
    api.ts      cliente HTTP y simulador local
    library.tsx estado de la biblioteca y sondeo de avance
    types.ts    tipos de dominio
    youtube.ts  parseo de enlaces, miniaturas y formato de tiempo
    seed.ts     resúmenes de ejemplo
    gsap.ts     registro de plugins de GSAP
  index.css     tokens de diseño (oscuro y claro), Tailwind
```

## Despliegue en Netlify

- Build: `pnpm build`; directorio de publicación: `dist`. No hace falta ninguna variable de entorno.
- `public/_redirects` redirige cualquier ruta a `index.html` (`/*  /index.html  200`), para que recargar `/app/ajustes` o un resumen no dé 404.
- La dirección del backend y la clave se escriben en **Ajustes** una vez desplegado (ver «Conectar el backend»).

## Contexto de producto

`PRODUCT.md` resume el contexto de producto y diseño del proyecto.

## Pendientes conocidos

- El bundle es de unos 514 kB (174 kB comprimido); se puede dividir por rutas.
- No hay `DESIGN.md` ni revisión final de diseño.
- No hay pruebas automatizadas.

TubeRezume no está afiliado a YouTube.
