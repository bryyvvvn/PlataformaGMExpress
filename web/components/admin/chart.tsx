import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PuntoSemanal = {
  day: string;
  pedidos: number;
};

type PedidosSemanalChartProps = {
  data: PuntoSemanal[];
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

export function PedidosSemanalChart({ data, title }: PedidosSemanalChartProps) {
  const max = Math.max(...data.map((d) => d.pedidos), 1);
  const marcas = marcasEje(max);
  const alto = 200;
  const ancho = 600;
  const margen = 40;
  const area = alto - margen * 2;

  const puntos = data.map((d, i) => {
    const x =
      margen + (i * (ancho - margen * 2)) / Math.max(data.length - 1, 1);
    const y = alto - margen - (d.pedidos / max) * area;
    return { x, y, ...d };
  });

  const linea = puntos
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
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

          {puntos.map((p, i) => (
            <text
              key={`dia-${i}`}
              x={p.x}
              y={alto - margen + 18}
              textAnchor="middle"
              className="fill-muted-foreground text-[11px]"
            >
              {p.day}
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
