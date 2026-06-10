-- CreateEnum
CREATE TYPE "TipoEmpaquetado" AS ENUM (
  'BOWL_CRAFT',
  'C10_ALUMINIO',
  'SERVICIO_TRADICIONAL_PLATO'
);

-- AlterTable
ALTER TABLE "ConvenioEmpresa"
ADD COLUMN "tipoEmpaquetado" "TipoEmpaquetado";
