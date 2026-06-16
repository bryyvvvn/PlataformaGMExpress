"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PuntoSemanal = {
  day: string;
  pedidos: number;
};

type PuntoDiario = {
  time: string;
  pedidos: number;
};

type ChartProps = {
  dataSemana: PuntoSemanal[];
  dataDia: PuntoDiario[];
  dataMes: PuntoSemanal[];
  title: string;
};

function marcasEje(max: number): number[] {
  if (max <= 1) return [0, 1];
  if (max <= 5) return Array.from({ length: max + 1 }, (_, i) => i);

  const paso = Math.ceil(max / 4);
  const marcas = new Set<number>([0]);
  for (let v = paso; v < max; v += paso) marcas.add(v);
  marcas.add(max);
  return [...marcas].sort((a, b) => a - b);
}

export function PedidosSemanalChart({ dataSemana, dataDia, dataMes, title }: ChartProps) {
  const [vista, setVista] = useState<"semana" | "dia" | "mes">("semana");

  const puntosBase =
    vista === "semana"
      ? dataSemana.map((d) => ({ label: d.day, pedidos: d.pedidos }))
      : vista === "dia"
      ? dataDia.map((d) => ({ label: d.time, pedidos: d.pedidos }))
      : dataMes.map((d) => ({ label: d.day, pedidos: d.pedidos }));

  const max = Math.max(...puntosBase.map((d) => d.pedidos), 1);
  const marcas = marcasEje(max);
  const alto = 200;
  const ancho = 600;
  const margen = 40;
  const area = alto - margen * 2;

  const intervaloEje = vista === 'semana' ? 1 : vista === 'dia' ? 2 : 5;

  const puntos = puntosBase.map((d, i) => {
    const x =
      margen + (i * (ancho - margen * 2)) / Math.max(puntosBase.length - 1, 1);
    const y = alto - margen - (d.pedidos / max) * area;
    return { x, y, ...d };
  });

  const linea = puntos
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex gap-1 rounded-md border border-border p-0.5">
          <button
            onClick={() => setVista("semana")}
            className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
              vista === "semana"
                ? "bg-[#1b2c56] text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setVista("dia")}
            className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
              vista === "dia"
                ? "bg-[#75aa46] text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setVista("mes")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              vista === "mes"
                ? "bg-[#1b2c56] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mes
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <svg
          viewBox={`0 0 ${ancho} ${alto}`}
          className="w-full text-primary"
          role="img"
          aria-label={title}
        >
          {marcas.map((valor) => {
            const y = alto - margen - (valor / max) * area;
            return (
              <line
                key={valor}
                x1={margen}
                y1={y}
                x2={ancho - margen}
                y2={y}
                className="stroke-border"
                strokeDasharray="4 4"
              />
            );
          })}

          <line
            x1={margen}
            y1={alto - margen}
            x2={ancho - margen}
            y2={alto - margen}
            className="stroke-muted-foreground/40"
          />
          <line
            x1={margen}
            y1={margen}
            x2={margen}
            y2={alto - margen}
            className="stroke-muted-foreground/40"
          />

          <path
            d={linea}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />

          {puntos.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="4" fill="currentColor" />
          ))}

          {puntos.map((p, i) => i % intervaloEje === 0 && (
            <text
              key={`label-${i}`}
              x={p.x}
              y={alto - margen + 18}
              textAnchor="middle"
              fontSize={11}
              className="fill-muted-foreground"
            >
              {p.label}
            </text>
          ))}

          {marcas.map((valor) => {
            const y = alto - margen - (valor / max) * area;
            return (
              <text
                key={valor}
                x={margen - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-muted-foreground text-[11px]"
              >
                {valor}
              </text>
            );
          })}
        </svg>
      </CardContent>
    </Card>
  );
}
