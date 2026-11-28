CREATE SEQUENCE "pago_folio_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE TABLE "Pago" (
    "id" SERIAL NOT NULL,
    "compraId" INTEGER NOT NULL,
    "cuotaId" INTEGER NOT NULL,
    "montoCLP" INTEGER NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "folio" VARCHAR(24) NOT NULL,
    "idempotencyKey" VARCHAR(128) NOT NULL,
    "registradoPorId" INTEGER NOT NULL,
    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Pago_cuotaId_key" ON "Pago"("cuotaId");
CREATE UNIQUE INDEX "Pago_folio_key" ON "Pago"("folio");
CREATE UNIQUE INDEX "Pago_idempotencyKey_key" ON "Pago"("idempotencyKey");
CREATE INDEX "Pago_compraId_fechaPago_idx" ON "Pago"("compraId", "fechaPago");
CREATE INDEX "Pago_registradoPorId_idx" ON "Pago"("registradoPorId");

ALTER TABLE "Pago" ADD CONSTRAINT "Pago_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_cuotaId_fkey" FOREIGN KEY ("cuotaId") REFERENCES "Cuota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
