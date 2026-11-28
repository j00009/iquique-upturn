CREATE TYPE "RolUsuario" AS ENUM ('CLIENTE', 'FUNCIONARIO', 'ADMIN');
CREATE TYPE "EstadoCompra" AS ENUM ('PENDIENTE_DE_PAGO', 'PARCIALMENTE_PAGADO', 'PAGADO', 'ANULADO');
CREATE TYPE "ModalidadPago" AS ENUM ('TOTAL', 'DOS_CUOTAS');
CREATE TYPE "EstadoCuota" AS ENUM ('PENDIENTE', 'PAGADA');

CREATE TABLE "Municipalidad" (
  "id" SERIAL NOT NULL,
  "nombre" VARCHAR(120) NOT NULL,
  CONSTRAINT "Municipalidad_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Cliente" (
  "id" SERIAL NOT NULL,
  "rut" VARCHAR(12) NOT NULL,
  "nombre" VARCHAR(160) NOT NULL,
  "correo" VARCHAR(254),
  "telefono" VARCHAR(30),
  "municipalidadId" INTEGER NOT NULL,
  CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Vehiculo" (
  "id" SERIAL NOT NULL,
  "patente" VARCHAR(6) NOT NULL,
  "tipo" VARCHAR(40) NOT NULL,
  "marca" VARCHAR(80),
  "modelo" VARCHAR(80),
  "anio" INTEGER NOT NULL,
  "clienteId" INTEGER NOT NULL,
  "municipalidadId" INTEGER NOT NULL,
  CONSTRAINT "Vehiculo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Usuario" (
  "id" SERIAL NOT NULL,
  "correo" VARCHAR(254) NOT NULL,
  "hashContrasena" VARCHAR(255) NOT NULL,
  "rol" "RolUsuario" NOT NULL,
  "clienteId" INTEGER,
  "municipalidadId" INTEGER,
  CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Compra" (
  "id" SERIAL NOT NULL,
  "clienteId" INTEGER NOT NULL,
  "municipalidadId" INTEGER NOT NULL,
  "periodo" INTEGER NOT NULL,
  "modalidad" "ModalidadPago" NOT NULL,
  "estado" "EstadoCompra" NOT NULL DEFAULT 'PENDIENTE_DE_PAGO',
  "totalCLP" INTEGER NOT NULL,
  "montoPagadoCLP" INTEGER NOT NULL DEFAULT 0,
  "creadaPorId" INTEGER NOT NULL,
  "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizadaEn" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Compra_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DetalleCompraVehiculo" (
  "id" SERIAL NOT NULL,
  "compraId" INTEGER NOT NULL,
  "vehiculoId" INTEGER NOT NULL,
  "periodo" INTEGER NOT NULL,
  "valorBaseCLP" INTEGER NOT NULL,
  "totalCargosCLP" INTEGER NOT NULL,
  "totalDescuentosCLP" INTEGER NOT NULL,
  "totalCLP" INTEGER NOT NULL,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "DetalleCompraVehiculo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Cuota" (
  "id" SERIAL NOT NULL,
  "compraId" INTEGER NOT NULL,
  "numero" INTEGER NOT NULL,
  "montoCLP" INTEGER NOT NULL,
  "estado" "EstadoCuota" NOT NULL DEFAULT 'PENDIENTE',
  "fechaPago" TIMESTAMP(3),
  "fechaVencimiento" TIMESTAMP(3),
  CONSTRAINT "Cuota_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Municipalidad_nombre_key" ON "Municipalidad"("nombre");
CREATE UNIQUE INDEX "Cliente_rut_key" ON "Cliente"("rut");
CREATE INDEX "Cliente_municipalidadId_idx" ON "Cliente"("municipalidadId");
CREATE UNIQUE INDEX "Vehiculo_patente_key" ON "Vehiculo"("patente");
CREATE INDEX "Vehiculo_clienteId_idx" ON "Vehiculo"("clienteId");
CREATE INDEX "Vehiculo_municipalidadId_idx" ON "Vehiculo"("municipalidadId");
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");
CREATE UNIQUE INDEX "Usuario_clienteId_key" ON "Usuario"("clienteId");
CREATE INDEX "Usuario_municipalidadId_idx" ON "Usuario"("municipalidadId");
CREATE INDEX "Compra_clienteId_idx" ON "Compra"("clienteId");
CREATE INDEX "Compra_municipalidadId_periodo_idx" ON "Compra"("municipalidadId", "periodo");
CREATE UNIQUE INDEX "DetalleCompraVehiculo_compraId_vehiculoId_key" ON "DetalleCompraVehiculo"("compraId", "vehiculoId");
CREATE INDEX "DetalleCompraVehiculo_vehiculoId_periodo_idx" ON "DetalleCompraVehiculo"("vehiculoId", "periodo");
CREATE INDEX "DetalleCompraVehiculo_compraId_idx" ON "DetalleCompraVehiculo"("compraId");
CREATE UNIQUE INDEX "Cuota_compraId_numero_key" ON "Cuota"("compraId", "numero");
CREATE INDEX "Cuota_compraId_idx" ON "Cuota"("compraId");

CREATE UNIQUE INDEX "detalle_vehiculo_periodo_activo_uq"
  ON "DetalleCompraVehiculo" ("vehiculoId", "periodo")
  WHERE "activo" = true;

ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_municipalidadId_fkey" FOREIGN KEY ("municipalidadId") REFERENCES "Municipalidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Vehiculo" ADD CONSTRAINT "Vehiculo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Vehiculo" ADD CONSTRAINT "Vehiculo_municipalidadId_fkey" FOREIGN KEY ("municipalidadId") REFERENCES "Municipalidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_municipalidadId_fkey" FOREIGN KEY ("municipalidadId") REFERENCES "Municipalidad"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_municipalidadId_fkey" FOREIGN KEY ("municipalidadId") REFERENCES "Municipalidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_creadaPorId_fkey" FOREIGN KEY ("creadaPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DetalleCompraVehiculo" ADD CONSTRAINT "DetalleCompraVehiculo_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DetalleCompraVehiculo" ADD CONSTRAINT "DetalleCompraVehiculo_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "Vehiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Cuota" ADD CONSTRAINT "Cuota_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;
