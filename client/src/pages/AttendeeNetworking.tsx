import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Globe2, Linkedin, Loader2, Save, Twitter, UserRound } from "lucide-react";
import { toast } from "sonner";

interface ProfileForm {
  bio: string;
  interests: string;
  industry: string;
  linkedinUrl: string;
  twitterUrl: string;
  websiteUrl: string;
  isPublic: boolean;
}

const emptyForm: ProfileForm = {
  bio: "",
  interests: "",
  industry: "",
  linkedinUrl: "",
  twitterUrl: "",
  websiteUrl: "",
  isPublic: true,
};

export default function AttendeeNetworking() {
  const [, setLocation] = useLocation();
  const [attendeeId, setAttendeeId] = useState<number | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);

  useEffect(() => {
    const stored = localStorage.getItem("attendeeId");
    if (!stored) {
      setLocation("/attendee/login");
      return;
    }

    try {
      const parsed = Number(JSON.parse(stored));
      if (Number.isInteger(parsed) && parsed > 0) setAttendeeId(parsed);
      else setLocation("/attendee/login");
    } catch {
      localStorage.removeItem("attendeeId");
      setLocation("/attendee/login");
    }
  }, [setLocation]);

  const { data: profile, isLoading } = trpc.profiles.getOrCreate.useQuery(attendeeId || 0, {
    enabled: !!attendeeId,
  });
  const updateProfile = trpc.profiles.update.useMutation({
    onSuccess: (savedProfile) => {
      setForm({
        bio: savedProfile?.bio || form.bio,
        interests: savedProfile?.interests || form.interests,
        industry: savedProfile?.industry || form.industry,
        linkedinUrl: savedProfile?.linkedinUrl || form.linkedinUrl,
        twitterUrl: savedProfile?.twitterUrl || form.twitterUrl,
        websiteUrl: savedProfile?.websiteUrl || form.websiteUrl,
        isPublic: savedProfile?.isPublic ?? form.isPublic,
      });
      toast.success("Networking profile saved");
    },
    onError: (error) => toast.error(error.message || "Unable to save profile"),
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      bio: profile.bio || "",
      interests: profile.interests || "",
      industry: profile.industry || "",
      linkedinUrl: profile.linkedinUrl || "",
      twitterUrl: profile.twitterUrl || "",
      websiteUrl: profile.websiteUrl || "",
      isPublic: profile.isPublic,
    });
  }, [profile]);

  const updateField = <K extends keyof ProfileForm>(field: K, value: ProfileForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!attendeeId) return;
    updateProfile.mutate({ attendeeId, ...form });
  };

  if (!attendeeId) return null;

  const attendeeName = localStorage.getItem("attendeeName");
  const displayName = attendeeName ? JSON.parse(attendeeName) : "Attendee";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-5 sm:px-6 md:py-7">
          <Button variant="ghost" onClick={() => setLocation("/attendee/dashboard")} className="px-0 text-slate-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Events
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 md:py-12">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">EventHub Networking</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Your networking profile</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Help fellow attendees discover what you do and find common interests before the next event.
          </p>
        </div>

        {isLoading ? (
          <Card><CardContent className="flex items-center justify-center py-16 text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading profile...</CardContent></Card>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5 text-blue-600" /> {displayName}</CardTitle>
                <CardDescription>Share a concise introduction and the topics you want to discuss.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" value={form.bio} onChange={(e) => updateField("bio", e.target.value)} placeholder="Tell attendees about your experience, goals, or what brought you to EventHub..." rows={5} maxLength={500} />
                  <p className="text-right text-xs text-slate-500">{form.bio.length}/500</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interests">Interests</Label>
                  <Input id="interests" value={form.interests} onChange={(e) => updateField("interests", e.target.value)} placeholder="AI, product design, climate tech" />
                  <p className="text-xs text-slate-500">Separate interests with commas so people can scan them quickly.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input id="industry" value={form.industry} onChange={(e) => updateField("industry", e.target.value)} placeholder="Technology, healthcare, education..." maxLength={100} />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2"><Label htmlFor="linkedinUrl">LinkedIn</Label><Input id="linkedinUrl" type="url" value={form.linkedinUrl} onChange={(e) => updateField("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/..." /></div>
                  <div className="space-y-2"><Label htmlFor="twitterUrl">X / Twitter</Label><Input id="twitterUrl" type="url" value={form.twitterUrl} onChange={(e) => updateField("twitterUrl", e.target.value)} placeholder="https://x.com/..." /></div>
                  <div className="space-y-2"><Label htmlFor="websiteUrl">Website</Label><Input id="websiteUrl" type="url" value={form.websiteUrl} onChange={(e) => updateField("websiteUrl", e.target.value)} placeholder="https://your-site.com" /></div>
                </div>
                <Button type="submit" disabled={updateProfile.isPending} className="w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto">
                  {updateProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {updateProfile.isPending ? "Saving..." : "Save profile"}
                </Button>
              </CardContent>
            </Card>

            <Card className="h-fit">
              <CardHeader><CardTitle className="text-lg">Profile visibility</CardTitle><CardDescription>Choose whether other attendees can discover you.</CardDescription></CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div><Label htmlFor="isPublic" className="font-semibold">Public profile</Label><p className="mt-1 text-xs text-slate-600">Show your profile in the attendee networking directory.</p></div>
                  <Switch id="isPublic" checked={form.isPublic} onCheckedChange={(checked) => updateField("isPublic", checked)} aria-label="Make profile public" />
                </div>
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex gap-3"><Globe2 className="mt-0.5 h-4 w-4 text-blue-600" /><span>Public profiles help attendees find relevant conversations.</span></div>
                  <div className="flex gap-3"><Linkedin className="mt-0.5 h-4 w-4 text-blue-600" /><span>Add social links only if you are comfortable sharing them.</span></div>
                  <div className="flex gap-3"><Twitter className="mt-0.5 h-4 w-4 text-slate-500" /><span>You can change visibility at any time.</span></div>
                </div>
              </CardContent>
            </Card>
          </form>
        )}
      </main>
    </div>
  );
}
