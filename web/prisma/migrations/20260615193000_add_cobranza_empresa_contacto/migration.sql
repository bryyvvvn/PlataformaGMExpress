-- AlterEnum
ALTER TYPE "TipoContactoEmpresa" ADD VALUE 'COBRANZA';

-- AlterTable
ALTER TABLE "Empresa"
ADD COLUMN "fechaNacimientoRepresentanteLegal" TIMESTAMP(3);
