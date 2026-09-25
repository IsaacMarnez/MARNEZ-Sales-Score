# MARNEZ Sales Score · V0.7.1

Versión con acceso administrativo protegido, roles reales y reconocimiento Top Seller premium.

## Novedades V0.7.1

- Login real para `/admin` con sesión segura mediante cookie `HttpOnly`.
- El botón **Administrador** no aparece en la vista pública si no existe una sesión administrativa iniciada.
- Si alguien escribe `/admin` directamente sin sesión, verá únicamente la pantalla de login.
- Roles aplicados en backend y frontend:
  - **Superadministrador:** todo el panel, incluyendo Usuarios.
  - **Administrador:** dashboard, asesores, Top Seller, historial, configuración y sincronización.
  - **Visualizador:** consulta administrativa en modo solo lectura.
- Contraseñas protegidas con PBKDF2-SHA256 y salt individual; no se almacenan en texto plano.
- Sesiones administrativas almacenadas en D1 y con expiración.
- Primer acceso protegido mediante un Secret de Cloudflare llamado `ADMIN_SETUP_CODE`.
- El diploma Top Seller fue refinado a fondo blanco con detalles dorados, sin firma y mostrando el número de ventas.
- Frase del diploma: **“Tu constancia, enfoque y dedicación convierten el esfuerzo en resultados extraordinarios.”**

## Antes de publicar

Mantén los valores existentes:

- binding D1: `DB`
- Secret/variable: `SHAREPOINT_FILE_URL`

Y crea un nuevo **Secret** en Cloudflare:

```text
ADMIN_SETUP_CODE
```

El valor lo eliges tú. Usa una frase o código largo que solo conozca quien configurará el primer Superadministrador. No lo guardes en GitHub.

## Primer acceso administrativo

Después del despliegue:

1. Abre `/api/health` y confirma:

```json
{
  "ok": true,
  "version": "0.7.1",
  "d1": true,
  "sharepointConfigured": true,
  "authConfigured": false
}
```

2. Abre `/admin`.
3. Aparecerá **Activar administración**.
4. Captura nombre, correo, contraseña y el valor de `ADMIN_SETUP_CODE`.
5. Esa cuenta se convertirá en el primer **Superadministrador**.
6. A partir de ese momento `/admin` mostrará login cuando no haya sesión.

## Crear otros administradores

El Superadministrador entra a **Usuarios** y crea cada cuenta con:

- nombre
- correo
- contraseña inicial
- rol

También puede restablecer la contraseña desde el mismo apartado.

## Seguridad

Las rutas `/api/admin/*`, sincronización y diagnóstico de SharePoint están protegidas en el Worker. Ocultar botones en el frontend no es la única protección: el backend valida la sesión y el rol antes de entregar o modificar datos administrativos.

## Base D1

La V0.7.1 crea automáticamente las columnas de autenticación y la tabla `admin_sessions` al ejecutarse. También se incluye `migrations/0003_admin_auth.sql` como referencia para instalaciones nuevas.

## Top Seller y diploma

La vista pública mantiene:

- ranking
- Top 3
- Top Seller
- reconocimiento animado
- descarga del reconocimiento PNG
- descarga del diploma PNG

El diploma tiene fondo blanco, detalles dorados, identidad MARNEZ y muestra las ventas del asesor. No incluye firma.


## Corrección V0.7.1
- Corrige HTTP 500 al activar el primer administrador en Workers Free.
- Sustituye PBKDF2 intensivo por HMAC-SHA256 con salt y secreto privado del Worker para respetar el límite de CPU.
- Los errores de activación/login ahora devuelven un mensaje descriptivo.
- Mantén `ADMIN_SETUP_CODE` configurado; opcionalmente puede usarse `ADMIN_AUTH_SECRET` como secreto dedicado.


## Acceso inicial V0.7.1
- Se eliminó completamente el campo `ADMIN_SETUP_CODE`.
- La pantalla `/admin` muestra únicamente el login.
- Si todavía no existe un administrador, el primer inicio de sesión válido crea automáticamente el Superadministrador.
- Configura en Cloudflare como Secrets: `SUPERADMIN_EMAIL` y `SUPERADMIN_PASSWORD`.
- `SUPERADMIN_NAME` es opcional.
- No guardes contraseñas en GitHub ni en `wrangler.toml`.


## Novedades V0.7.1
- Fallback automático a iniciales cuando una fotografía externa falla.
- Carga directa de fotografías desde Administrador → Asesores.
- Las fotografías se recortan a formato cuadrado, se comprimen y se guardan en D1 como imagen optimizada; no requieren URL pública.
- Botón para quitar fotografía y volver a iniciales.


## Novedades V0.7.1
- Rediseño visual de los reconocimientos con un estilo premium inspirado en la referencia compartida.
- Reconocimiento PNG ahora en formato horizontal con fondo oscuro, foto protagonista, nombre sobre banda central y título TOP SELLER destacado.
- Certificado PDF horizontal rediseñado con la misma línea visual premium y mucho menos texto.
- Eliminados montos, conteos y bloques secundarios para priorizar foto, nombre y reconocimiento.


## Novedades V0.7.1
- Descarga de reconocimiento PNG y certificado PDF también para el 2do y 3er lugar.
- Nuevo bloque de "Descargas del podio" en la vista pública y en el panel Top Seller del administrador.
- Los reconocimientos se personalizan automáticamente según la posición: Top Seller, Segundo Lugar y Tercer Lugar.


## Novedades V0.7.1
- El apartado Top Seller ahora se llama Reconocimientos.
- Se muestran directamente 1er, 2do y 3er lugar en tarjetas visibles sin tener que buscar otro bloque.
- Cada posición tiene botón propio para descargar Reconocimiento PNG y Certificado PDF.
- Corregida la búsqueda de asesores por ID para que los botones funcionen aunque D1 devuelva IDs numéricos.


## Corrección V0.7.1
- Las tarjetas de Top 1, Top 2 y Top 3 aparecen directamente al abrir Administrador → Reconocimientos.
- Cada posición incluye sus botones de Reconocimiento PNG y Certificado PDF.
- Se corrigió la comparación de IDs numéricos/texto que podía impedir las descargas.
- Se versionaron app.js y styles.css para evitar que el navegador conserve la interfaz anterior en caché.
