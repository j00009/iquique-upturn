ALTER TABLE "Compra" ADD COLUMN "idempotencyKey" VARCHAR(128);
CREATE UNIQUE INDEX "Compra_creadaPorId_idempotencyKey_key" ON "Compra"("creadaPorId", "idempotencyKey");

CREATE TABLE "Cotizacion" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "municipalidadId" INTEGER NOT NULL,
    "periodo" INTEGER NOT NULL,
    "creadaPorId" INTEGER NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "usada" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Cotizacion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CotizacionVehiculo" (
    "id" SERIAL NOT NULL,
    "cotizacionId" INTEGER NOT NULL,
    "vehiculoId" INTEGER NOT NULL,
    "patente" VARCHAR(6) NOT NULL,
    "tipo" VARCHAR(40) NOT NULL,
    "marca" VARCHAR(80),
    "modelo" VARCHAR(80),
    "anio" INTEGER NOT NULL,
    "valorBaseCLP" INTEGER NOT NULL,
    "totalCargosCLP" INTEGER NOT NULL,
    "totalDescuentosCLP" INTEGER NOT NULL,
    "totalCLP" INTEGER NOT NULL,
    "cargos" JSONB NOT NULL,
    "descuentos" JSONB NOT NULL,
    CONSTRAINT "CotizacionVehiculo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CotizacionVehiculo_cotizacionId_vehiculoId_key" ON "CotizacionVehiculo"("cotizacionId", "vehiculoId");
CREATE INDEX "Cotizacion_clienteId_periodo_idx" ON "Cotizacion"("clienteId", "periodo");
CREATE INDEX "Cotizacion_creadaPorId_creadaEn_idx" ON "Cotizacion"("creadaPorId", "creadaEn");
CREATE INDEX "Cotizacion_expiraEn_usada_idx" ON "Cotizacion"("expiraEn", "usada");
CREATE INDEX "CotizacionVehiculo_vehiculoId_idx" ON "CotizacionVehiculo"("vehiculoId");

ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_municipalidadId_fkey" FOREIGN KEY ("municipalidadId") REFERENCES "Municipalidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_creadaPorId_fkey" FOREIGN KEY ("creadaPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CotizacionVehiculo" ADD CONSTRAINT "CotizacionVehiculo_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CotizacionVehiculo" ADD CONSTRAINT "CotizacionVehiculo_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "Vehiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
