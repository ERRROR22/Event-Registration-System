import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin, Users, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [attendeeId, setAttendeeId] = useState<number | null>(null);

  const { data: event, isLoading } = trpc.events.getById.useQuery(parseInt(id || "0"), {
    enabled: !!id,
  });

  const registerMutation = trpc.registrations.register.useMutation({
    onSuccess: () => {
      toast.success("Successfully registered for the event!");
      setShowRegisterDialog(false);
      setAttendeeId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to register");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-10 md:h-12 w-3/4 mb-4" />
          <Skeleton className="h-64 md:h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AlertCircle className="w-12 md:w-16 h-12 md:h-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">Event not found</h1>
          <Button onClick={() => setLocation("/events")} className="mt-4 w-full sm:w-auto">
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const cutoffDate = new Date(event.registrationCutoffDate);
  const now = new Date();
  const isCutoffPassed = now > cutoffDate;
  const isEventPassed = now > eventDate;
  const isFull = event.registrationCount >= event.capacity;
  const spotsRemaining = event.capacity - event.registrationCount;
  const capacityPercentage = (event.registrationCount / event.capacity) * 100;

  const canRegister = !isCutoffPassed && !isEventPassed && !isFull;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/events")}
            className="mb-4 text-slate-600 px-0"
          >
            ← Back to Events
          </Button>
          <h1 className="text-4xl font-bold text-slate-900">{event.title}</h1>
          {event.category && (
            <span className="inline-block mt-3 text-sm font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded">
              {event.category}
            </span>
          )}
        </div>
      </div>

      {/* Banner Image */}
      {event.imageUrl && (
        <div className="w-full h-64 md:h-96 bg-slate-200 overflow-hidden">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {event.description && (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>About This Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Event Details */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date & Time */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Date & Time</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {format(eventDate, "EEEE, MMMM dd, yyyy")}
                    </p>
                    <p className="text-slate-600">{format(eventDate, "h:mm a")}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {formatDistanceToNow(eventDate, { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Location</p>
                    <p className="text-lg font-semibold text-slate-900">{event.location}</p>
                  </div>
                </div>

                {/* Registration Cutoff */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Registration Deadline</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {format(cutoffDate, "MMMM dd, yyyy • h:mm a")}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {isCutoffPassed ? "Deadline passed" : `${formatDistanceToNow(cutoffDate, { addSuffix: true })}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Capacity Card */}
            <Card className="border-slate-200 sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Capacity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-600">
                      {event.registrationCount} / {event.capacity} registered
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {Math.round(capacityPercentage)}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                      style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  {isFull ? (
                    <p className="text-sm font-semibold text-red-600">Event is at full capacity</p>
                  ) : (
                    <p className="text-sm font-semibold text-green-600">
                      {spotsRemaining} spot{spotsRemaining !== 1 ? "s" : ""} remaining
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status & CTA */}
            <Card className="border-slate-200">
              <CardContent className="pt-6 space-y-4">
                {isEventPassed && (
                  <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-3 rounded-lg">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">This event has already passed</span>
                  </div>
                )}

                {isCutoffPassed && !isEventPassed && (
                  <div className="flex items-center gap-2 text-orange-600 bg-orange-50 p-3 rounded-lg">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">Registration deadline has passed</span>
                  </div>
                )}

                {isFull && !isEventPassed && !isCutoffPassed && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">Event is at full capacity</span>
                  </div>
                )}

                {canRegister && (
                  <Button
                    onClick={() => setShowRegisterDialog(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
                  >
                    Register Now
                  </Button>
                )}

                {!canRegister && (
                  <Button disabled className="w-full h-11">
                    Registration Unavailable
                  </Button>
                )}

                <p className="text-xs text-slate-500 text-center">
                  Already registered? <a href="/attendee/login" className="text-blue-600 hover:underline">Log in</a> to view your events
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Registration Dialog */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Register for Event</DialogTitle>
            <DialogDescription>
              Enter your details to register for {event.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="attendee-email">Email</Label>
              <Input
                id="attendee-email"
                type="email"
                placeholder="your@email.com"
                className="mt-1"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                Don't have an account? <a href="/attendee/register" className="font-semibold hover:underline">Register first</a> to create an account and register for events.
              </p>
            </div>

            <Button
              onClick={() => setLocation("/attendee/register")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Go to Registration
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowRegisterDialog(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
