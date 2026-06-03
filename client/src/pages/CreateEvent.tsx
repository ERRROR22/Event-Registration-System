import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function CreateEvent() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    date: "",
    time: "",
    capacity: "",
    registrationCutoffDate: "",
    registrationCutoffTime: "",
    category: "",
  });

  const createEventMutation = trpc.events.create.useMutation({
    onSuccess: (event) => {
      toast.success("Event created successfully!");
      setLocation(`/host/dashboard`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create event");
    },
  });

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md border-slate-200">
          <CardHeader>
            <CardTitle>Create Event</CardTitle>
            <CardDescription>Please log in to create an event</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => window.location.href = getLoginUrl()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Login with Manus
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter event title");
      return;
    }

    if (!formData.location.trim()) {
      toast.error("Please enter event location");
      return;
    }

    if (!formData.date) {
      toast.error("Please select event date");
      return;
    }

    if (!formData.time) {
      toast.error("Please select event time");
      return;
    }

    if (!formData.capacity || parseInt(formData.capacity) <= 0) {
      toast.error("Please enter a valid capacity");
      return;
    }

    if (!formData.registrationCutoffDate) {
      toast.error("Please select registration cutoff date");
      return;
    }

    if (!formData.registrationCutoffTime) {
      toast.error("Please select registration cutoff time");
      return;
    }

    const eventDate = new Date(`${formData.date}T${formData.time}`);
    const cutoffDate = new Date(`${formData.registrationCutoffDate}T${formData.registrationCutoffTime}`);

    if (cutoffDate >= eventDate) {
      toast.error("Registration cutoff must be before event date");
      return;
    }

    createEventMutation.mutate({
      title: formData.title,
      description: formData.description || undefined,
      location: formData.location,
      date: eventDate,
      capacity: parseInt(formData.capacity),
      registrationCutoffDate: cutoffDate,
      category: formData.category || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-3xl">Create New Event</CardTitle>
            <CardDescription>
              Fill in the details below to create your event
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  placeholder="Annual Tech Conference 2026"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={createEventMutation.isPending}
                  className="mt-1"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell attendees about your event..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={createEventMutation.isPending}
                  rows={4}
                  className="mt-1"
                />
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="San Francisco, CA"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={createEventMutation.isPending}
                  className="mt-1"
                />
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Technology, Business, Music"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  disabled={createEventMutation.isPending}
                  className="mt-1"
                />
              </div>

              {/* Date & Time */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Event Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    disabled={createEventMutation.isPending}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="time">Event Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    disabled={createEventMutation.isPending}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Capacity */}
              <div>
                <Label htmlFor="capacity">Capacity (Max Attendees) *</Label>
                <Input
                  id="capacity"
                  type="number"
                  placeholder="100"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  disabled={createEventMutation.isPending}
                  className="mt-1"
                />
              </div>

              {/* Registration Cutoff */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">Registration Cutoff</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cutoffDate">Cutoff Date *</Label>
                    <Input
                      id="cutoffDate"
                      type="date"
                      value={formData.registrationCutoffDate}
                      onChange={(e) => setFormData({ ...formData, registrationCutoffDate: e.target.value })}
                      disabled={createEventMutation.isPending}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cutoffTime">Cutoff Time *</Label>
                    <Input
                      id="cutoffTime"
                      type="time"
                      value={formData.registrationCutoffTime}
                      onChange={(e) => setFormData({ ...formData, registrationCutoffTime: e.target.value })}
                      disabled={createEventMutation.isPending}
                      className="mt-1"
                    />
                  </div>
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  Attendees won't be able to register after this date and time
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/host/dashboard")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createEventMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {createEventMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Event"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
