# MARNEZ Sales Score · FINAL V0.7.3

Paquete limpio para reemplazar el contenido actual del repositorio.

## Estructura correcta

- `worker/index.js` — Worker/API principal. `/api/health` reporta `0.7.3`.
- `public/index.html` — carga únicamente `app-0.7.3.js` y `styles-0.7.3.css`.
- `public/app-0.7.3.js` — interfaz final con botones PNG/PDF para 2.º y 3.º lugar.
- `public/styles-0.7.3.css` — estilos finales.
- `public/assets/` — logos MARNEZ.
- `public/fonts/` — tipografías del proyecto.
- `migrations/` — migraciones D1 existentes.
- `wrangler.toml` — configuración actual de Worker, D1, Assets y cron.
- `package.json` — dependencia `fflate` y scripts de Wrangler.

## Importante

Este paquete NO contiene archivos antiguos `app.js`, `styles.css`, `app-0.7.1.js`, `app-0.7.2.js`, `styles-0.7.1.css`, `styles-0.7.2.css` ni `index.html` en la raíz.

Para reemplazo limpio en GitHub, conserva `.git` del repositorio pero elimina los archivos/carpetas actuales del proyecto y sube **el contenido de esta carpeta** a la raíz del repositorio.

Después del deploy, verifica:

`/api/health` → `"version":"0.7.3"`
