# Municipalidad de Iquique · Permiso de Circulación en Angular

**Evaluación Sumativa 2 (ES2) · Estudio de caso: Permiso de Circulación en Angular**
Universidad Católica del Maule · Ingeniería de Ejecución Informática
Académico: Pablo Vilches Valenzuela · Fecha de entrega: 26-10-2026

**Integrante(s):** Victor Perez, Joel Troncoso

Aplicación Angular estandarizada para el sitio de la Municipalidad de Iquique desarrollado en la ES1 (portada institucional) y agrega el flujo de **consulta y pago simulado del permiso de circulación**: buscar por patente, revisar antecedentes, completar datos del propietario, pagar, obtener un comprobante y consultar el historial de pagos.

---

## 1. Requisitos e instalación

Requisitos: **Node.js** y **npm**. El proyecto se desarrolló con Node 24.19.0, npm 12.0.2, Angular 22.2 y Angular CLI 22.2.4.

```bash
# 1. Entrar a la carpeta del proyecto (la que contiene package.json)
cd muni-iquique

# 2. Instalar dependencias
npm install

# 3. Levantar el servidor de desarrollo
ng serve
```
## 2. Probar la aplicación

La aplicación funciona desde el primer inicio: al abrirla por primera vez carga los datos de ejemplo en `localStorage`.

### Datos de ejemplo

Municipalidad de todos los permisos: **Municipalidad de Iquique**, año 2026.

| Patente | Vehículo | Propietario | Monto | Estado inicial | Qué permite demostrar |
|---|---|---|---|---|---|
| `KJBH45` | Suzuki Swift 2020 | María González Rojas | $85.400 | **Impago** | Consulta exitosa y pago completo |
| `HGFD90` | Toyota Hilux 2022 (camioneta) | Jorge Araya Díaz | $148.700 | **Impago** | Otro pago con monto distinto |
| `CD1234` | Chevrolet Spark 2012 | Rosa Muñoz Castro | $38.200 | **Impago** | Patente con formato antiguo (2 letras + 4 números) |
| `PLMN78` | Chevrolet Sail 2018 | Carlos Pizarro Soto | $62.900 | **Pagado** | Transacción ya pagada (comprobante `CP-SEED0001`) |
| `RTYU23` | Kia Morning 2021 | Ana Flores Vega | $54.300 | **Datos incompletos** | Propietaria sin correo ni teléfono: obliga a completar el formulario antes de pagar |
| `ZZZZ00` (o cualquier otra) | — | — | — | No existe | Patente no encontrada |

### Recorridos sugeridos

1. **Consulta exitosa y pago:** `Permiso de Circulación` (menú) → buscar `KJBH45` → *Ver antecedentes* → *Pagar permiso* → marcar la confirmación → *Confirmar y pagar* → comprobante.
2. **Permiso ya pagado:** buscar `PLMN78`. Muestra el aviso de pagado y el acceso a su comprobante. Después de pagar `KJBH45`, volver a buscarlo muestra lo mismo.
3. **Datos incompletos:** buscar `RTYU23` → *Completar datos*. Probar campos vacíos, un correo inválido (`abc`) y un teléfono corto para ver los mensajes de error. Al guardar con datos válidos, redirige directamente al pago.
4. **Patente no encontrada:** buscar `ZZZZ00`. También se valida el formato (por ejemplo `ABC` muestra un error de formato).
5. **Evitar duplicados:** intentar abrir `/pago/PC-2026-KJBH45` después de haber pagado ese permiso: el sistema lo rechaza.
6. **Historial:** menú *Mis pagos* lista las transacciones con su total; cada comprobante se puede abrir y se puede imprimir.

### Reiniciar los datos de prueba


- Botón **Reiniciar datos de prueba** al final de las páginas *Historial* y *Buscar permiso* (pide confirmación). Borra los pagos simulados y restaura los datos originales.

---

## 3. Funcionalidades

### Sitio institucional (migrado desde la ES1)

- Barra de navegación responsiva con menú desplegable en celular.
- Carrusel de destacados con flechas, indicadores, autoplay con botón de pausa y soporte de deslizamiento táctil.
- Buscador de trámites que **filtra en vivo** las tarjetas mientras se escribe (ignora tildes y mayúsculas).
- Próximo feriado nacional, leído con `fetch()` desde un archivo local.
- Tarjetas de trámites frecuentes (un componente reutilizado con datos), seguridad ciudadana 1402, farmacias de turno, noticias, promoción de la app y formulario de contacto con validación.
- Pie de página siempre al fondo de la ventana.

### Flujo del permiso de circulación (nuevo en la ES2)

| Pantalla | Ruta | Qué hace |
|---|---|---|
| Inicio | `/` | Portada del sitio |
| Búsqueda | `/busqueda` | Busca por patente y informa: no encontrada, datos incompletos, impago o ya pagado |
| Detalle | `/permiso/:patente` | Antecedentes del vehículo, propietario y permiso, con la acción que corresponde |
| Formulario | `/permiso/:patente/datos` | Completa nombre, correo y celular del propietario |
| Pago | `/pago/:permisoId` | Muestra municipalidad, vehículo y monto; confirma y registra el pago simulado |
| Comprobante | `/comprobante/:pagoId` | Identificador, fecha, patente, municipalidad, monto y estado; se puede imprimir |
| Historial | `/historial` | Lista de pagos realizados y total pagado |

### Validaciones de formularios

- **Patente:** obligatoria; formato chileno `ABCD12` (4 letras + 2 números) o `AB1234` (2 letras + 4 números).
- **Datos del propietario:** nombre obligatorio de al menos 3 caracteres, correo electrónico válido, celular chileno válido (por ejemplo `+56 9 1234 5678`).
- **Pago:** requiere confirmar la operación; el botón se desactiva mientras se procesa.
- **Contacto:** nombre (mínimo 3), correo válido, asunto y mensaje (mínimo 10).

Todos muestran mensajes de error claros junto al campo.


## 4. Servicio de persistencia (`localStorage`)

La persistencia está **centralizada en servicios**: ningún componente accede a `localStorage` directamente.

| Servicio | Responsabilidad |
|---|---|
| `Almacenamiento` | Único punto de acceso a `localStorage`. Lee, escribe y borra valores en formato JSON, con manejo de errores. |
| `Datos` | Carga los datos de ejemplo la primera vez (se ejecuta al iniciar la app) y permite reiniciarlos. |
| `Permisos` | Consulta de antecedentes por patente o por identificador, actualización de datos del propietario y cambio de estado del permiso. |
| `Pagos` | Registro de pagos simulados, listado del historial y consulta de comprobantes. |

Claves utilizadas en `localStorage`: `muni-iquique.vehiculos`, `muni-iquique.propietarios`, `muni-iquique.permisos` y `muni-iquique.pagos`.

**Cómo se guarda un pago.** `Pagos.registrar(permisoId)` valida las reglas de negocio (el permiso debe existir, no estar pagado y tener los datos del propietario completos), genera el comprobante (`CP-...`) con fecha, patente, municipalidad y monto, lo guarda en `muni-iquique.pagos` y le pide a `Permisos` marcar el permiso como **pagado** (estado y nueva vigencia hasta el 31-03-2027). Como las reglas viven en el servicio, un permiso no puede pagarse dos veces aunque se acceda directamente por la URL.

Los datos persisten al recargar la página y al cerrar el navegador. Cada navegador (y la ventana de incógnito) tiene su propio `localStorage`.

