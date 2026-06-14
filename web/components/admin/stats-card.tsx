import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StatsCardProps = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: "primary" | "success" | "warning" | "destructive";
  loading?: boolean;
};

const iconStyles = {
  primary: "border border-slate-200 bg-slate-50 text-[#1B2C56]",
  success: "border border-[#75AA46]/30 bg-[#75AA46]/10 text-[#75AA46]",
  warning: "border border-amber-200 bg-amber-50 text-amber-700",
  destructive: "border border-red-200 bg-red-50 text-red-700",
} as const;

export function StatsCard({
  title,
  value,
  icon,
  color = "primary",
  loading = false,
}: StatsCardProps) {
  return (
    <Card className="rounded-md border-slate-200 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pb-1 pt-4">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {title}
        </CardTitle>
        <div className={`rounded-md p-1.5 ${iconStyles[color]}`}>{icon}</div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {loading ? (
          <div className="h-8 w-20 bg-slate-200 rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-semibold tabular-nums text-[#1B2C56]">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}
