# MARNEZ Sales Score · V0.4.0

Portal de ranking comercial conectado a D1 y preparado para sincronizar el Excel original de SharePoint.

## Novedades V0.3.0
- Administrador con navegación funcional: Dashboard, Asesores, Top Seller, Historial, Usuarios y Configuración.
- Separación entre **ranking real** y **ranking público**.
- Las ventas del Excel nunca se alteran para modificar el reconocimiento.
- Por asesor se puede configurar:
  - Participa en ranking: Sí / No.
  - Elegible para Top Seller: Sí / No.
  - Mostrar en portal público: Sí / No.
  - Nombre visible.
  - URL de fotografía.
  - Motivo o nota interna de exclusión.
- El Top Seller público se calcula solo entre asesores elegibles.
- Las preferencias administrativas permanecen en D1 aunque el Excel vuelva a sincronizarse.
- Vista previa, animación y descarga PNG del Top Seller.
- Historial mensual basado en `monthly_rankings`.
- Registro de usuarios y roles en D1.
- El Worker crea automáticamente las nuevas columnas de V0.3.0 si aún no existen.

## Caso Diana / Coordinación
En Administrador → Asesores, desactiva:
- `Participa en ranking`
- `Elegible para Top Seller`

Las ventas de Diana seguirán apareciendo en el **Ranking real** del administrador, pero no ocupará una posición en el ranking público ni recibirá el reconocimiento Top Seller.

## Importante sobre Usuarios
La V0.3.0 permite registrar usuarios y roles (`superadmin`, `admin`, `viewer`) en D1. La autenticación/login y la aplicación efectiva de permisos por usuario todavía no están activadas; esa capa debe añadirse antes de considerar el panel administrador protegido.

## Variables de Cloudflare
Mantener `SHAREPOINT_FILE_URL` como Secret/Variable de runtime en Cloudflare. No guardar el vínculo compartido en GitHub.

## D1
Binding esperado:
```toml
[[d1_databases]]
binding = "DB"
database_name = "marnez-sales-score-db"
database_id = "99190a2F-24E4-486D-8C73-65B472E5458E"
```

El archivo `migrations/0002_advisor_ranking_controls.sql` documenta las columnas nuevas. No es obligatorio ejecutarlo manualmente porque el Worker valida y agrega las columnas faltantes al iniciar.

## Endpoints nuevos
- `GET /api/admin/overview`
- `GET /api/admin/advisors`
- `PATCH /api/admin/advisors/:id`
- `GET /api/admin/history`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users/:id`
- `GET /api/admin/settings`

## Verificación
Después del despliegue:
```text
/api/health
```
Debe indicar:
```json
{"ok":true,"version":"0.3.0","d1":true,"sharepointConfigured":true}
```


## Novedades V0.4.0
- Reconocimiento Top Seller rediseñado con composición premium.
- Descarga del reconocimiento en PNG con mejor distribución visual.
- Nuevo diploma institucional en PNG con leyenda “Top Seller del Mes”.
- Frase motivadora integrada en reconocimiento y diploma.
