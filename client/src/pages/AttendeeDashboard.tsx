import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, MapPin, LogOut, AlertCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function AttendeeDashboard() {
  const [, setLocation] = useLocation();
  const [attendeeId, setAttendeeId] = useState<number | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("attendeeId");
    if (stored) {
      setAttendeeId(JSON.parse(stored));
    } else {
      setLocation("/attendee/login");
    }
  }, [setLocation]);

  const { data: registrations, isLoading, refetch } = trpc.registrations.getByAttendee.useQuery(
    attendeeId || 0,
    { enabled: !!attendeeId }
  );

  const cancelMutation = trpc.registrations.cancel.useMutation({
    onSuccess: () => {
      toast.success("Registration cancelled successfully");
      setShowCancelDialog(false);
      setSelectedEventId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel registration");
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("attendeeId");
    localStorage.removeItem("attendeeName");
    toast.success("Logged out successfully");
    setLocation("/");
  };

  const handleCancelRegistration = (eventId: number) => {
    if (!attendeeId) return;
    cancelMutation.mutate({ eventId, attendeeId });
  };

  if (!attendeeId) {
    return null;
  }

  const attendeeName = localStorage.getItem("attendeeName");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">My Events</h1>
              <p className="text-sm sm:text-base text-slate-600 mt-1 md:mt-2">
                Welcome, {attendeeName ? JSON.parse(attendeeName) : "Attendee"}
              </p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="text-slate-700 w-full sm:w-auto h-10 md:h-11 text-sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-slate-200">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !registrations || registrations.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No registered events</h3>
            <p className="text-slate-600 mb-6">
              You haven't registered for any events yet. Browse events and register now!
            </p>
            <Button
              onClick={() => setLocation("/events")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Browse Events
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {registrations.map((registration) => {
              const eventDate = new Date(registration.event.date);
              const now = new Date();
              const isEventPassed = now > eventDate;

              return (
                <Card key={registration.id} className="border-slate-200 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg">{registration.event.title}</CardTitle>
                      {registration.event.category && (
                        <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {registration.event.category}
                        </span>
                      )}
                    </div>
                    {registration.event.description && (
                      <CardDescription className="line-clamp-2">
                        {registration.event.description}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Date */}
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{format(eventDate, "MMM dd, yyyy • HH:mm")}</span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{registration.event.location}</span>
                    </div>

                    {/* Registration Date */}
                    <div className="text-xs text-slate-500 border-t border-slate-200 pt-3">
                      Registered on {format(new Date(registration.registeredAt), "MMM dd, yyyy")}
                    </div>

                    {/* Status & Actions */}
                    <div className="flex gap-2 pt-2">
                      {isEventPassed ? (
                        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded flex-1">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs font-medium">Event has passed</span>
                        </div>
                      ) : (
                        <Button
                          onClick={() => {
                            setSelectedEventId(registration.event.id);
                            setShowCancelDialog(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Cancel Registration
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Browse More Events */}
        {registrations && registrations.length > 0 && (
          <div className="mt-12 text-center">
            <Button
              onClick={() => setLocation("/events")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Browse More Events
            </Button>
          </div>
        )}
      </div>

      {/* Cancel Registration Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Registration?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your registration for this event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Keep Registration
            </Button>
            <Button
              onClick={() => selectedEventId && handleCancelRegistration(selectedEventId)}
              disabled={cancelMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {cancelMutation.isPending ? "Cancelling..." : "Cancel Registration"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
