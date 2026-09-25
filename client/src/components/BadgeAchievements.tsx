import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Lock } from "lucide-react";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc";

interface BadgeAchievementsProps {
  attendeeId: number;
}

const badgeLabels: Record<string, { label: string; description: string; icon: string }> = {
  first_event: { label: "First Event", description: "Registered for your first event", icon: "🎟️" },
  five_events: { label: "Event Explorer", description: "Registered for five events", icon: "🧭" },
  ten_events: { label: "Event Regular", description: "Registered for ten events", icon: "🌟" },
  super_fan: { label: "Super Fan", description: "Checked in to multiple events", icon: "💫" },
  referral_master: { label: "Referral Master", description: "Helped your network discover events", icon: "🤝" },
  early_bird: { label: "Early Bird", description: "Registered early for an event", icon: "🐦" },
  night_owl: { label: "Night Owl", description: "Joined an evening event", icon: "🌙" },
  weekend_warrior: { label: "Weekend Warrior", description: "Attended a weekend event", icon: "⚡" },
};

export default function BadgeAchievements({ attendeeId }: BadgeAchievementsProps) {
  const { data: badges, isLoading } = trpc.badges.getByAttendee.useQuery(attendeeId);

  if (isLoading) return <Card className="animate-pulse"><CardContent className="h-56" /></Card>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Award className="h-5 w-5 text-amber-500" /> Badges & achievements</CardTitle>
        <CardDescription>Celebrate the milestones you reach across EventHub.</CardDescription>
      </CardHeader>
      <CardContent>
        {badges && badges.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {badges.map((badge) => {
              const info = badgeLabels[badge.badgeType] || { label: badge.badgeType, description: "EventHub achievement", icon: "🏅" };
              return <div key={badge.id} className="flex items-center gap-3 rounded-lg border border-amber-100 bg-amber-50/60 p-3"><span className="text-2xl">{info.icon}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-slate-900">{info.label}</span><Badge variant="secondary" className="text-[10px]">Earned</Badge></div><p className="text-xs text-slate-600">{info.description}</p><p className="mt-1 text-[11px] text-slate-500">{format(new Date(badge.earnedAt), "MMM d, yyyy")}</p></div></div>;
            })}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-600"><Lock className="h-4 w-4 text-slate-400" /> Your first achievement is waiting—join an event to unlock it.</div>
        )}
      </CardContent>
    </Card>
  );
}
