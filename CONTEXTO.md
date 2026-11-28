# Contexto del proyecto

## Propósito

Este repositorio contiene un prototipo académico para la Municipalidad de Iquique: un frontend Angular heredado de la Evaluación 2 y un backend REST independiente para la Evaluación 3. El backend implementa clientes/vehículos (3.1) y valores/cargos con vista previa (3.2); todavía no implementa pagos.

El proyecto corresponde a una aplicación web Angular de una sola página (SPA), escrita en TypeScript. La interfaz y los datos de ejemplo están en español y usan el formato regional `es-CL`.

## Cómo se inicia y organiza

- `src/main.ts` arranca Angular y `src/app/app.config.ts` configura el router, el idioma y la carga inicial de datos.
- `src/app/app.ts` es el componente raíz; monta la navegación, el contenido de la ruta y el pie de página.
- `src/app/app.routes.ts` declara las pantallas y sus URL.
- `src/app/pages/` contiene las pantallas; `src/app/components/` contiene piezas reutilizables de la interfaz.
- `src/app/services/` concentra persistencia y reglas de negocio.
- `src/app/models/` define las estructuras de vehículos, propietarios, permisos, pagos y datos relacionados.
- `src/app/data/datos-iniciales.ts` contiene los registros semilla. `src/app/data/feriados.json` se publica como `/data/feriados.json` y alimenta el widget de feriados.
- `public/img/` contiene imágenes y recursos gráficos usados por la aplicación.
- `backend/` contiene la API Node.js/Express/TypeScript, el esquema Prisma/PostgreSQL, migración inicial, seed y pruebas Jest/Supertest.
- `home-para-ia.html` y `home-iquique-por-situacion.html` son maquetas HTML independientes de referencia; no son las pantallas Angular ni forman parte de las rutas de la aplicación.

La aplicación usa componentes Angular standalone. Los estilos globales están en `src/styles.css`; cada página o componente tiene sus estilos junto a su plantilla y clase TypeScript.

## Recorrido principal

La portada (`/`) presenta servicios municipales y permite llegar a la búsqueda. El trámite de permiso sigue estas rutas:

| Ruta | Pantalla | Responsabilidad |
|---|---|---|
| `/busqueda` | Búsqueda | Normaliza y consulta una patente; muestra errores y estado del permiso. |
| `/permiso/:patente` | Detalle | Presenta antecedentes del vehículo, propietario y permiso. |
| `/permiso/:patente/datos` | Formulario | Completa los datos requeridos del propietario. |
| `/pago/:permisoId` | Pago | Confirma y registra una transacción simulada. |
| `/comprobante/:pagoId` | Comprobante | Muestra el resultado guardado y permite imprimirlo. |
| `/historial` | Historial | Lista pagos guardados y permite reiniciar los datos de demostración. |

El frontend conserva los estados locales `impago`, `incompleto` y `pagado` de E2. El backend 3.1 usa las entidades `Cliente`, `Vehiculo`, `Compra`, `DetalleCompraVehiculo` y `Cuota`, con estados de permiso derivados de compras activas para el período consultado. La API y el frontend aún no están conectados.

## Persistencia y datos de demostración

`Almacenamiento` es el único servicio que accede a `localStorage`. Usa las claves `muni-iquique.vehiculos`, `muni-iquique.propietarios`, `muni-iquique.permisos` y `muni-iquique.pagos`. `Datos.inicializar()` se ejecuta al arrancar y siembra cada clave solo cuando aún no existe. Por eso, editar los arreglos iniciales no reemplaza automáticamente los datos ya guardados en el navegador; para volver a la semilla se usa la acción de reinicio de la interfaz.

Los registros E2 y las transacciones simuladas son ficticios y quedan en el almacenamiento local del navegador. Borrar los datos del sitio o usar otro navegador da un estado distinto. La base PostgreSQL del backend E3 es independiente y todavía no está conectada al frontend.

## Desarrollo

Requisitos y pasos detallados, casos de prueba manual y credenciales de ejemplo están documentados en [README (1).md](<README (1).md>). Los comandos declarados en el `package.json` raíz son `npm start` (servidor Angular), `npm run build` y `npm test`. El despliegue está configurado para Cloudflare Pages mediante `wrangler.jsonc`, sirviendo `dist/muni-iquique/browser` con fallback SPA.

Al modificar el flujo, mantén sincronizados rutas, modelos, datos semilla, validaciones de servicios y documentación de uso. Las pruebas unitarias están junto a las clases bajo prueba (`*.spec.ts`). Evita introducir acceso a `localStorage` desde páginas o componentes: debe seguir centralizado en `Almacenamiento`.

## API y alcance

La API vive en `backend/`; sus instrucciones de instalación, JWT y endpoints están en [backend/README.md](backend/README.md). La API requiere PostgreSQL para ejecutarse contra datos reales. Las pruebas de servicio y ruta simulan Prisma y corren sin una base externa.

- El módulo 3.1 no incluye pagos ni transición de estados por cobro; eso pertenece al punto 3.3.
- `POST /auth/login` emite JWT; `GET /auth/me` valida y devuelve la identidad autenticada. La API no gestiona pagos.
- El seed es demostrativo y reemplaza compras del período actual de sus clientes de prueba; solo debe usarse en una base de desarrollo.

## Límites del frontend

- Es una demostración académica, no un canal oficial para trámites reales.
- El frontend E2 no se comunica aún con la API E3 ni sincroniza su `localStorage` con PostgreSQL.
- La portada incluye información estática de ejemplo; el feriado se lee desde un JSON local. No asumir que noticias, farmacias, montos, estados o datos personales representan información municipal vigente.
- La persistencia local sirve para conservar y demostrar el flujo en un navegador, no para guardar información sensible ni para garantizar integridad transaccional.
