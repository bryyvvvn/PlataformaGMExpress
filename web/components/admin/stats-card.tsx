import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StatsCardProps = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: "primary" | "success" | "warning" | "destructive";
};

const iconStyles = {
  primary: "bg-primary/10 text-primary",
  success: "bg-green-500/10 text-green-600",
  warning: "bg-yellow-500/10 text-yellow-600",
  destructive: "bg-red-500/10 text-red-600",
} as const;

export function StatsCard({
  title,
  value,
  icon,
  color = "primary",
}: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`rounded-lg p-2 ${iconStyles[color]}`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
