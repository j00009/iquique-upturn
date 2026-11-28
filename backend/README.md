# API municipal — módulos 3.1 y 3.2

Backend REST independiente para la Evaluación 3. Usa Node.js, Express, TypeScript, Prisma y PostgreSQL. El frontend Angular original permanece en la raíz del repositorio.

## Preparación

```bash
cd backend
npm install
cp .env.example .env
# Ajustar JWT_SECRET en .env; DATABASE_URL usa localhost:5433/permisos
docker compose up -d db
npm run prisma:generate
npm run db:deploy
npm run db:seed
npm run dev
```

En otra terminal, desde `backend/`, corre `npm test`.

El seed es de demostración: reemplaza las compras del período actual asociadas a sus tres clientes de prueba y no debe ejecutarse en una base con datos reales. Crea contraseñas con bcrypt y no guarda texto plano. No implementa pagos.

`POST /auth/login` valida credenciales con bcrypt y firma JWT con `JWT_SECRET`; la duración se configura con `JWT_EXPIRES_IN` (por defecto `8h`). El token contiene `id`, `correo`, `rol`, `clienteId` y `municipalidadId`. `GET /auth/me` devuelve la identidad validada del token. `GET /ping` es público y devuelve texto `pong`.

### Credenciales de prueba (solo desarrollo)

Estas credenciales se incluyen únicamente para probar localmente. Las cuatro usan la contraseña `Demo-2026-Cambiar`; en PostgreSQL se almacena solo el hash bcrypt. No uses estas cuentas en producción.

| Rol | Correo | Municipalidad / vínculo |
|---|---|---|
| ADMIN | `admin@muni.cl` | Todas |
| FUNCIONARIO | `funcionario@muni.cl` | Municipalidad de Iquique |
| CLIENTE | `cliente@muni.cl` | María González Rojas, con 3 vehículos |
| CLIENTE | `cliente2@muni.cl` | Jorge Araya Díaz, vínculo distinto para probar denegación |

## Endpoints

- `POST /auth/login`: recibe `{ "correo", "password" }`; credenciales incorrectas responden `401 Credenciales inválidas` sin distinguir correo y contraseña.
- `GET /auth/me`: devuelve la identidad del JWT vigente.
- `GET /ping`: respuesta de texto `pong`; registra la operación.

Los siguientes endpoints requieren `Authorization: Bearer <token>`:

- `GET /clientes?q=&page=1&limit=10`: búsqueda parcial en RUT, nombre e ID; `limit` máximo 50. RUT se guarda canónicamente como `12345678-5`, pero la consulta acepta las formas `12.345.678-5`, `12345678-5` y `123456785`.
- `GET /clientes/:id`: ficha, municipalidad y cantidad de vehículos.
- `GET /clientes/:id/vehiculos?periodo=2026`: vehículos y estado del permiso calculado desde compra/cuotas.
- `GET/POST /tarifas`, `PUT /tarifas/:id`, `PATCH /tarifas/:id/estado`: mantenedor de tarifas.
- `GET/POST /cargos`, `PUT /cargos/:id`, `PATCH /cargos/:id/estado`: mantenedor de cargos; desactivar usa `activo:false`.
- `POST /tarifas/calcular`: vista previa sin persistencia; valida elegibilidad y devuelve desglose/total.

Los clientes solo pueden consultar su propio cliente; si intentan consultar otro ID reciben 403. Los funcionarios solo ven clientes de su municipalidad. Los administradores pueden consultar todos. Los errores responden `{ "codigo", "mensaje", "detalle" }`.

El servicio reusable `ClientesService.validarVehiculosDelCliente(clienteId, vehiculoIds, periodo, usuarioId?)` rechaza listas vacías/repetidas y vehículos inexistentes, ajenos o con compra activa. La pertenencia ajena devuelve 403; conflictos de compra devuelven 409. El cuarto argumento opcional sirve para registrar `usuario_id` cuando lo invoque la cotización o compra.

## Compras y cuotas modeladas para este módulo

`Compra` conserva el estado y los montos históricos; `DetalleCompraVehiculo` guarda los montos por vehículo y período; `Cuota` guarda cada vencimiento y pago. La consulta de vehículos obtiene cliente, vehículos, municipalidad, detalles, compra y estado de cuotas mediante una sola operación anidada de Prisma. El estado de la compra en esta etapa se lee; la transición automática a partir de pagos se implementará en el módulo 3.3.

Regla futura, documentada para 3.3: en `DOS_CUOTAS`, la primera cuota será `totalCLP / 2` con división entera; la segunda será `totalCLP - cuota1`. El seed usa la regla y deja una compra pagada (ambas cuotas pagadas) y una parcialmente pagada (cuota 1 pagada, cuota 2 pendiente).

La migración inicial incluye el índice único parcial de PostgreSQL que impide dos detalles activos para el mismo vehículo y período. La migración 3.2 es posterior y aditiva. Las pruebas Jest/Supertest usan Prisma simulado; no requieren PostgreSQL. Ejecutar con `npm test`.

`LogService` usa Pino y emite eventos JSON con operación, fecha ISO y `usuario_id`. Redacta claves `password`, `token` y `authorization`. No se pasan credenciales, tokens ni cabeceras al logger.

## Tarifas y cargos (módulo 3.2)

La nueva migración incremental `202611280001_valores_cargos` agrega `TarifaPermiso`, `CargoAdicional`, `CargoAplicado` y sus enums/índices; la migración inicial ya aplicada se mantiene intacta. `CargoAplicado` queda disponible para la copia histórica futura, pero este módulo no lo escribe.

La vista previa usa solo tarifas activas de la categoría exacta del vehículo y cargos activos cuya vigencia incluye la fecha del cálculo, en la municipalidad del vehículo. Un porcentaje se aplica al valor base y se redondea con `Math.round`; el total queda limitado a cero. Los seed de 2026 incluyen dos categorías por municipalidad, cargos fijos, porcentuales, descuento, inactivo y vencido. Las compras de prueba se asignan a Jorge para mantener los tres vehículos de María disponibles para previsualizar.

Para verificar los casos de cálculo, ejecuta `npm test` (tests unitarios en `src/services/valores.service.spec.ts`): base sin cargos, fijo, porcentaje/redondeo, descuento, filtro por estado/vigencia, tarifa inexistente (409) y total mínimo cero. Las rutas, roles, duplicado 409, CRUD lógico y vista previa de dos vehículos están ilustradas en `requests.http` y cubiertas parcialmente por Supertest.

Las solicitudes manuales listas para REST Client están en [`requests.http`](requests.http). En una base vacía los primeros dos clientes tienen ID 1 y 2; si los IDs existentes son distintos, actualiza `@clienteId` y `@otroClienteId` luego de consultar la búsqueda de clientes.
