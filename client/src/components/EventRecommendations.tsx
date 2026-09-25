import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

interface EventRecommendationsProps {
  attendeeId: number;
}

export default function EventRecommendations({ attendeeId }: EventRecommendationsProps) {
  const [, setLocation] = useLocation();
  const { data: recommendations, isLoading: recommendationsLoading } =
    trpc.recommendations.getForAttendee.useQuery(attendeeId);
  const { data: events, isLoading: eventsLoading } = trpc.events.getUpcoming.useQuery({ limit: 100 });

  if (recommendationsLoading || eventsLoading) {
    return <Card className="animate-pulse"><CardContent className="h-48" /></Card>;
  }

  const eventById = new Map((events || []).map((event) => [event.id, event]));
  const matches = (recommendations || [])
    .map((recommendation) => ({ recommendation, event: eventById.get(recommendation.eventId) }))
    .filter((item): item is { recommendation: NonNullable<typeof recommendations>[number]; event: NonNullable<typeof events>[number] } => Boolean(item.event))
    .slice(0, 3);

  return (
    <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="h-5 w-5 text-blue-600" /> Recommended for you</CardTitle>
        <CardDescription>Events selected from your interests and attendee activity.</CardDescription>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <div className="rounded-lg border border-dashed border-blue-200 bg-white/70 p-5 text-sm text-slate-600">
            Recommendations will appear here as you build your EventHub profile and attend more events.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {matches.map(({ recommendation, event }) => (
              <button key={recommendation.id} onClick={() => setLocation(`/events/${event.id}`)} className="group rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-2"><span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">{recommendation.score}% match</span><ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1" /></div>
                <h3 className="font-semibold text-slate-900">{event.title}</h3>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500"><Calendar className="h-3.5 w-3.5" />{format(new Date(event.date), "MMM d, yyyy")}</div>
                {recommendation.reason && <p className="mt-3 line-clamp-2 text-xs text-slate-600">{recommendation.reason}</p>}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
