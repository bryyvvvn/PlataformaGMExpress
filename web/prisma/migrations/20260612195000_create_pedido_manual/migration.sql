-- CreateTable
CREATE TABLE "PedidoManual" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "observacion" VARCHAR(500),
    "creado_por" VARCHAR(100),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PedidoManual_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PedidoManual_empresaId_idx" ON "PedidoManual"("empresaId");

-- CreateIndex
CREATE INDEX "PedidoManual_fecha_idx" ON "PedidoManual"("fecha");

-- CreateIndex
CREATE INDEX "PedidoManual_empresaId_fecha_idx" ON "PedidoManual"("empresaId", "fecha");

-- AddForeignKey
ALTER TABLE "PedidoManual" ADD CONSTRAINT "PedidoManual_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
