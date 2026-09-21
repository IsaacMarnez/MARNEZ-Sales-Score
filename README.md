# MARNEZ Sales Score · V0.1.1

Primera base funcional del portal de ranking comercial.

## Ya incluye
- Vista de asesores y ruta `/admin` dentro del mismo portal.
- Ranking ordenado automáticamente por ventas.
- Podio Top 3.
- Top Seller destacado.
- Animación de reconocimiento.
- Descarga del reconocimiento del Top Seller en PNG.
- Branding MARNEZ aplicado: logos, paleta institucional y tipografías Guaruja Neue.
- Fotografía opcional; si falta, usa iniciales.
- Panel administrativo base.
- D1: esquema para asesores, administradores, histórico y configuración.
- Endpoint `/api/sharepoint/status` para validar la conexión con el Excel de SharePoint mediante Microsoft Graph.
- Fallback con datos demo mientras se configura el Excel real.

## Pendiente para V0.2.0
1. Mapear las columnas reales del Excel `reporte marta ongay vendedores del mes.xlsx`.
2. Descargar y procesar el XLSX automáticamente.
3. Detectar cambios con `eTag` / `lastModifiedDateTime`.
4. Persistir cada corte mensual en D1.
5. Autenticación real y roles de administradores.
6. Carga de fotografías.
7. Conectar la gestión real de fotografías/perfiles desde administrador.

## Ejecutar local
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Cloudflare D1
Crear la base:
```bash
npx wrangler d1 create marnez-sales-score-db
```
Copiar el `database_id` en `wrangler.toml` y ejecutar:
```bash
npx wrangler d1 execute marnez-sales-score-db --remote --file=./migrations/0001_init.sql
```

## Variables secretas de Microsoft
No deben guardarse en GitHub. Cargarlas con:
```bash
npx wrangler secret put MICROSOFT_TENANT_ID
npx wrangler secret put MICROSOFT_CLIENT_ID
npx wrangler secret put MICROSOFT_CLIENT_SECRET
npx wrangler secret put SHAREPOINT_DRIVE_ID
npx wrangler secret put SHAREPOINT_ITEM_ID
```

## Flujo de sincronización diseñado
1. Consultar metadatos del archivo en SharePoint.
2. Comparar `eTag` con la última sincronización guardada.
3. Si cambió: descargar el XLSX.
4. Transformar filas del Excel a ventas por asesor.
5. Guardar ranking actual en D1.
6. Crear/cerrar histórico mensual.
7. Frontend consulta `/api/score` y actualiza la clasificación.

> Para implementar el paso 4 necesitamos revisar la estructura real del Excel: hojas, columnas y criterio que define una venta válida.
