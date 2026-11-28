CREATE TYPE "NaturalezaCargo" AS ENUM ('CARGO', 'DESCUENTO');
CREATE TYPE "TipoCargo" AS ENUM ('MONTO_FIJO', 'PORCENTAJE');

CREATE TABLE "TarifaPermiso" (
    "id" SERIAL NOT NULL,
    "municipalidadId" INTEGER NOT NULL,
    "periodo" INTEGER NOT NULL,
    "categoria" VARCHAR(40) NOT NULL,
    "valorBaseCLP" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "TarifaPermiso_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CargoAdicional" (
    "id" SERIAL NOT NULL,
    "municipalidadId" INTEGER NOT NULL,
    "descripcion" VARCHAR(200) NOT NULL,
    "naturaleza" "NaturalezaCargo" NOT NULL,
    "tipo" "TipoCargo" NOT NULL,
    "valor" INTEGER NOT NULL,
    "vigenciaDesde" DATE NOT NULL,
    "vigenciaHasta" DATE NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "CargoAdicional_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CargoAplicado" (
    "id" SERIAL NOT NULL,
    "detalleCompraVehiculoId" INTEGER NOT NULL,
    "descripcion" VARCHAR(200) NOT NULL,
    "naturaleza" "NaturalezaCargo" NOT NULL,
    "tipo" "TipoCargo" NOT NULL,
    "valor" INTEGER NOT NULL,
    "montoCLP" INTEGER NOT NULL,
    CONSTRAINT "CargoAplicado_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TarifaPermiso_municipalidadId_periodo_categoria_key" ON "TarifaPermiso"("municipalidadId", "periodo", "categoria");
CREATE INDEX "TarifaPermiso_municipalidadId_periodo_idx" ON "TarifaPermiso"("municipalidadId", "periodo");
CREATE INDEX "cargo_adicional_municipalidad_vigencia_idx" ON "CargoAdicional"("municipalidadId", "activo", "vigenciaDesde", "vigenciaHasta");
CREATE INDEX "CargoAplicado_detalleCompraVehiculoId_idx" ON "CargoAplicado"("detalleCompraVehiculoId");
ALTER TABLE "TarifaPermiso" ADD CONSTRAINT "TarifaPermiso_municipalidadId_fkey" FOREIGN KEY ("municipalidadId") REFERENCES "Municipalidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CargoAdicional" ADD CONSTRAINT "CargoAdicional_municipalidadId_fkey" FOREIGN KEY ("municipalidadId") REFERENCES "Municipalidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CargoAplicado" ADD CONSTRAINT "CargoAplicado_detalleCompraVehiculoId_fkey" FOREIGN KEY ("detalleCompraVehiculoId") REFERENCES "DetalleCompraVehiculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
