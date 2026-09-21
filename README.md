# MARNEZ Sales Score · V0.2.1

Versión conectada al Excel original compartido de SharePoint mediante un vínculo anónimo de solo lectura.

## Qué hace
- Mantiene el mismo Excel original como fuente de verdad.
- No requiere descargar/subir archivos manualmente.
- Cloudflare revisa el archivo automáticamente cada minuto.
- Calcula un hash SHA-256 para detectar si el XLSX cambió.
- Solo vuelve a procesar el Excel cuando detecta cambios.
- Busca automáticamente la fila de encabezados con `ASESOR` y `MONTO DE VENTA`.
- Agrupa ventas por asesor y suma el monto de venta.
- Si detecta una columna `FECHA` o `MES`, intenta filtrar al mes actual; si no puede determinarlo de forma confiable, procesa las filas disponibles.
- Guarda el ranking en D1.
- El frontend consulta `/api/score` cada 30 segundos.
- Incluye botón `Sincronizar ahora` en administrador.
- Conserva branding MARNEZ y descarga PNG del reconocimiento Top Seller.

## Configuración requerida en Cloudflare
Crear un secreto/variable cifrada en el Worker:

`SHAREPOINT_FILE_URL`

Valor: el vínculo compartido del Excel que funciona sin iniciar sesión. No es necesario añadir `download=1`; el Worker lo agrega automáticamente.

No guardar esta URL en GitHub.

## Endpoints
- `/api/health` — estado de D1 y configuración de SharePoint.
- `/api/score` — ranking actual.
- `/api/sharepoint/status` — comprueba si el vínculo devuelve un XLSX válido.
- `POST /api/sync` — fuerza una sincronización inmediata.

## Automatización
`wrangler.toml` incluye:

```toml
[triggers]
crons = ["* * * * *"]
```

Esto revisa el Excel una vez por minuto.


## Corrección 0.2.1
- Maneja manualmente las redirecciones de vínculos anónimos de SharePoint.
- Conserva las cookies temporales de invitado entre redirecciones, como un navegador.
- Usa encabezados de navegador para evitar rechazos del enlace compartido.
- Agrega `/api/sharepoint/diagnostic` para ver únicamente estados/hosts de la cadena, sin exponer cookies ni el vínculo secreto.
