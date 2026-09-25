import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Gift, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ReferralEvent {
  id: number;
  title: string;
}

interface ReferralCardProps {
  attendeeId: number;
  events: ReferralEvent[];
}

export default function ReferralCard({ attendeeId, events }: ReferralCardProps) {
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id?.toString() || "");
  const [referral, setReferral] = useState<{ referralCode: string; successCount: number } | null>(null);
  const createReferral = trpc.referrals.createForAttendee.useMutation({
    onSuccess: (data) => {
      setReferral(data);
      toast.success("Referral link created");
    },
    onError: (error) => toast.error(error.message || "Unable to create referral link"),
  });

  const handleCreate = () => {
    if (!selectedEventId) {
      toast.error("Choose an event first");
      return;
    }
    createReferral.mutate({ attendeeId, eventId: Number(selectedEventId) });
  };

  const referralUrl = referral
    ? `${window.location.origin}/events/${selectedEventId}?ref=${referral.referralCode}`
    : "";

  const handleCopy = async () => {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    toast.success("Referral link copied");
  };

  return (
    <Card className="border-purple-100 bg-gradient-to-br from-white to-purple-50/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Gift className="h-5 w-5 text-purple-600" /> Invite your network</CardTitle>
        <CardDescription>Share an event with friends and track successful referrals.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.length === 0 ? (
          <p className="rounded-lg bg-white/70 p-4 text-sm text-slate-600">Register for an event to create a shareable referral link.</p>
        ) : (
          <>
            <label className="block text-sm font-medium text-slate-700" htmlFor="referral-event">Event to share</label>
            <select id="referral-event" value={selectedEventId} onChange={(event) => { setSelectedEventId(event.target.value); setReferral(null); }} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200">
              {events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
            </select>
            <Button type="button" onClick={handleCreate} disabled={createReferral.isPending} className="w-full bg-purple-600 text-white hover:bg-purple-700">
              {createReferral.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
              {createReferral.isPending ? "Creating link..." : "Create referral link"}
            </Button>
            {referral && (
              <div className="rounded-lg border border-purple-200 bg-white p-3">
                <p className="mb-2 text-xs font-medium text-slate-500">Your referral link</p>
                <div className="flex items-center gap-2"><code className="min-w-0 flex-1 truncate text-xs text-purple-800">{referralUrl}</code><Button type="button" variant="outline" size="sm" onClick={handleCopy} aria-label="Copy referral link"><Copy className="h-4 w-4" /></Button></div>
                <p className="mt-2 text-xs text-slate-500">{referral.successCount} successful referral{referral.successCount === 1 ? "" : "s"}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
