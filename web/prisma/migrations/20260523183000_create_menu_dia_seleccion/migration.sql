ALTER TABLE "MenuDetalle"
DROP COLUMN IF EXISTS "seleccionado_menu_dia";

CREATE TABLE "MenuDiaSeleccion" (
  "id" SERIAL NOT NULL,
  "fecha_dia" TIMESTAMP(3) NOT NULL,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizado_en" TIMESTAMP(3) NOT NULL,
  "menuSemanalId" INTEGER NOT NULL,
  "entradaDetalleId" INTEGER NOT NULL,
  "fondoDetalleId" INTEGER NOT NULL,
  "postreDetalleId" INTEGER NOT NULL,
  "guarnicionId" INTEGER,

  CONSTRAINT "MenuDiaSeleccion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MenuDiaSeleccion_menuSemanalId_fecha_dia_key"
ON "MenuDiaSeleccion"("menuSemanalId", "fecha_dia");

CREATE INDEX "MenuDiaSeleccion_entradaDetalleId_idx"
ON "MenuDiaSeleccion"("entradaDetalleId");

CREATE INDEX "MenuDiaSeleccion_fondoDetalleId_idx"
ON "MenuDiaSeleccion"("fondoDetalleId");

CREATE INDEX "MenuDiaSeleccion_postreDetalleId_idx"
ON "MenuDiaSeleccion"("postreDetalleId");

CREATE INDEX "MenuDiaSeleccion_guarnicionId_idx"
ON "MenuDiaSeleccion"("guarnicionId");

ALTER TABLE "MenuDiaSeleccion"
ADD CONSTRAINT "MenuDiaSeleccion_menuSemanalId_fkey"
FOREIGN KEY ("menuSemanalId") REFERENCES "MenuSemanal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MenuDiaSeleccion"
ADD CONSTRAINT "MenuDiaSeleccion_entradaDetalleId_fkey"
FOREIGN KEY ("entradaDetalleId") REFERENCES "MenuDetalle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MenuDiaSeleccion"
ADD CONSTRAINT "MenuDiaSeleccion_fondoDetalleId_fkey"
FOREIGN KEY ("fondoDetalleId") REFERENCES "MenuDetalle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MenuDiaSeleccion"
ADD CONSTRAINT "MenuDiaSeleccion_postreDetalleId_fkey"
FOREIGN KEY ("postreDetalleId") REFERENCES "MenuDetalle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MenuDiaSeleccion"
ADD CONSTRAINT "MenuDiaSeleccion_guarnicionId_fkey"
FOREIGN KEY ("guarnicionId") REFERENCES "Guarnicion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
