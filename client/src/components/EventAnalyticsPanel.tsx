import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Eye, MessageSquare, UserPlus, UserRoundMinus } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface EventAnalyticsPanelProps {
  eventId: number;
}

export default function EventAnalyticsPanel({ eventId }: EventAnalyticsPanelProps) {
  const { data: analytics, isLoading: analyticsLoading } = trpc.analytics.getByEvent.useQuery(eventId);
  const { data: averageRating, isLoading: ratingLoading } = trpc.surveys.getAverageRating.useQuery(eventId);

  if (analyticsLoading || ratingLoading) {
    return <Card className="animate-pulse"><CardContent className="h-56" /></Card>;
  }

  const stats = [
    { label: "Page views", value: analytics?.totalViews ?? 0, icon: Eye, tone: "text-blue-600 bg-blue-50" },
    { label: "Registrations", value: analytics?.totalRegistrations ?? 0, icon: UserPlus, tone: "text-green-600 bg-green-50" },
    { label: "Cancellations", value: analytics?.totalCancellations ?? 0, icon: UserRoundMinus, tone: "text-orange-600 bg-orange-50" },
    { label: "Avg. rating", value: averageRating ? `${Number(averageRating).toFixed(1)}/5` : "—", icon: MessageSquare, tone: "text-purple-600 bg-purple-50" },
  ];

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-blue-600" /> Event analytics</CardTitle>
        <CardDescription>Track audience interest and registration performance at a glance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-md ${tone}`}><Icon className="h-4 w-4" /></div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-slate-50 p-4">
          <div className="mb-2 flex items-center justify-between text-sm"><span className="font-medium text-slate-700">Capacity conversion</span><span className="font-semibold text-slate-900">{analytics?.conversionRate || "0%"}</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${Math.min(Number.parseInt(analytics?.conversionRate || "0", 10), 100)}%` }} /></div>
          <p className="mt-2 text-xs text-slate-500">Conversion is calculated against the event capacity.</p>
        </div>
      </CardContent>
    </Card>
  );
}
