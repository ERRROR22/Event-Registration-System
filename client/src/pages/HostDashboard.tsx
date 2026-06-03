import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Plus, Users, Trash2, Edit, Eye, Download, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getLoginUrl } from "@/const";

export default function HostDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const { data: events, isLoading, refetch } = trpc.events.getByHost.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const deleteEventMutation = trpc.events.delete.useMutation({
    onSuccess: () => {
      toast.success("Event deleted successfully");
      setShowDeleteDialog(false);
      setSelectedEventId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete event");
    },
  });

  const closeEventMutation = trpc.events.close.useMutation({
    onSuccess: () => {
      toast.success("Event closed successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to close event");
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Skeleton className="h-12 w-1/2 mb-8" />
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md border-slate-200">
          <CardHeader>
            <CardTitle>Host Dashboard</CardTitle>
            <CardDescription>Please log in to access the host dashboard</CardDescription>
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

  const handleDeleteEvent = (eventId: number) => {
    deleteEventMutation.mutate(eventId);
  };

  const handleCloseEvent = (eventId: number) => {
    closeEventMutation.mutate(eventId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Host Dashboard</h1>
              <p className="text-slate-600 mt-2">Welcome, {user?.name}</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setLocation("/")}
                variant="outline"
                className="text-slate-700"
              >
                Back Home
              </Button>
              <Button
                onClick={() => setLocation("/host/events/create")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-6">
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
        ) : !events || events.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No events created yet</h3>
            <p className="text-slate-600 mb-6">
              Start by creating your first event to begin accepting registrations.
            </p>
            <Button
              onClick={() => setLocation("/host/events/create")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {events.map((event) => {
              const eventDate = new Date(event.date);
              const now = new Date();
              const isEventPassed = now > eventDate;
              const isFull = event.registrationCount >= event.capacity;

              return (
                <Card key={event.id} className="border-slate-200 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      {event.isClosed && (
                        <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-1 rounded">
                          Closed
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <CardDescription className="line-clamp-2">
                        {event.description}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Date */}
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{format(eventDate, "MMM dd, yyyy • HH:mm")}</span>
                    </div>

                    {/* Attendees */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">
                          {event.registrationCount} / {event.capacity} registered
                        </span>
                      </div>
                      <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600"
                          style={{
                            width: `${Math.min((event.registrationCount / event.capacity) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex gap-2 flex-wrap">
                      {isEventPassed && (
                        <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-1 rounded">
                          Past Event
                        </span>
                      )}
                      {isFull && !event.isClosed && (
                        <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-1 rounded">
                          At Capacity
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t border-slate-200">
                      <Button
                        onClick={() => setLocation(`/host/events/${event.id}`)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        onClick={() => setLocation(`/host/events/${event.id}/edit`)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      {!event.isClosed && (
                        <Button
                          onClick={() => handleCloseEvent(event.id)}
                          variant="outline"
                          size="sm"
                          disabled={closeEventMutation.isPending}
                        >
                          Close
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          setSelectedEventId(event.id);
                          setShowDeleteDialog(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedEventId && handleDeleteEvent(selectedEventId)}
              disabled={deleteEventMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteEventMutation.isPending ? "Deleting..." : "Delete Event"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
