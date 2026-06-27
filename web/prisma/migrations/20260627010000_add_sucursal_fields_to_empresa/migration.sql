-- AlterTable
ALTER TABLE "Empresa"
ADD COLUMN "esSucursal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "casaMatrizId" INTEGER;

-- CreateIndex
CREATE INDEX "Empresa_casaMatrizId_idx" ON "Empresa"("casaMatrizId");

-- AddForeignKey
ALTER TABLE "Empresa"
ADD CONSTRAINT "Empresa_casaMatrizId_fkey"
FOREIGN KEY ("casaMatrizId") REFERENCES "Empresa"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
