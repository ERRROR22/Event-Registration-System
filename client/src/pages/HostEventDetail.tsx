import { useAuth } from "@/_core/hooks/useAuth";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Users, Download, AlertCircle, Mail } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { getLoginUrl } from "@/const";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function HostEventDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: event, isLoading: eventLoading } = trpc.events.getById.useQuery(
    parseInt(id || "0"),
    { enabled: !!id }
  );

  const utils = trpc.useUtils();
  const deleteImageMutation = trpc.events.deleteImage.useMutation({
    onSuccess: () => {
      utils.events.getById.invalidate(parseInt(id || "0"));
      toast.success("Banner removed successfully");
    },
    onError: () => {
      toast.error("Failed to remove banner");
    },
  });

  const { data: registrations, isLoading: registrationsLoading } =
    trpc.registrations.getByEvent.useQuery(parseInt(id || "0"), {
      enabled: !!id && isAuthenticated,
    });

  const handleExportCsv = async () => {
    try {
      if (!registrations || registrations.length === 0) {
        toast.error("No attendees to export");
        return;
      }

      const headers = ["Name", "Email"];
      const rows = registrations.map((reg) => [
        reg.attendee.name,
        reg.attendee.email,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const element = document.createElement("a");
      const file = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      element.href = URL.createObjectURL(file);
      element.download = `attendees-${event?.title?.replace(/\s+/g, "-")}.csv`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success("Attendee list exported as CSV (Name + Email)");
    } catch (error: any) {
      toast.error(error?.message || "Failed to export CSV");
    }
  };

  if (authLoading || eventLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-10 md:h-12 w-1/2 mb-6 md:mb-8" />
          <Skeleton className="h-64 md:h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center py-8 md:py-12 px-4">
        <Card className="w-full max-w-md border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Event Details</CardTitle>
            <CardDescription className="text-sm md:text-base">Please log in to view event details</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => window.location.href = getLoginUrl()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 md:h-11 text-sm md:text-base"
            >
              Login with Manus
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Event not found</h1>
          <Button onClick={() => setLocation("/host/dashboard")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const spotsRemaining = event.capacity - event.registrationCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
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

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/host/dashboard")}
            className="mb-4 text-slate-600"
          >
            ← Back to Dashboard
          </Button>
          <div className="flex justify-between items-start">
            <h1 className="text-4xl font-bold text-slate-900">{event.title}</h1>
            {event.imageUrl && (
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to remove the event banner?")) {
                    deleteImageMutation.mutate(event!.id);
                  }
                }}
                disabled={deleteImageMutation.isPending}
                className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50 px-3 py-1 border border-red-200 rounded"
              >
                Remove Banner
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Info */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Event Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Date & Time</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {format(eventDate, "EEEE, MMMM dd, yyyy • h:mm a")}
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

                {/* Description */}
                {event.description && (
                  <div>
                    <p className="text-sm text-slate-600 mb-2">Description</p>
                    <p className="text-slate-700 whitespace-pre-wrap">{event.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendees List */}
            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Registered Attendees</CardTitle>
                  <CardDescription>
                    {registrationsLoading ? "Loading..." : `${registrations?.length || 0} attendees registered`}
                  </CardDescription>
                </div>
                {registrations && registrations.length > 0 && (
                  <Button
                    onClick={handleExportCsv}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                )}
              </CardHeader>

              <CardContent>
                {registrationsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                  </div>
                ) : !registrations || registrations.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-600">No attendees registered yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-200">
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Registered On</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {registrations.map((registration) => (
                          <TableRow key={registration.id} className="border-slate-200">
                            <TableCell className="font-medium">
                              {registration.attendee.name}
                            </TableCell>
                            <TableCell className="text-slate-600">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-slate-400" />
                                {registration.attendee.email}
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600">
                              {format(new Date(registration.registeredAt), "MMM dd, yyyy")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
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
                      {event.registrationCount} / {event.capacity}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {Math.round((event.registrationCount / event.capacity) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                      style={{
                        width: `${Math.min((event.registrationCount / event.capacity) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div>
                    <p className="text-xs text-slate-600">Registered</p>
                    <p className="text-2xl font-bold text-slate-900">{event.registrationCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Remaining Spots</p>
                    <p className="text-2xl font-bold text-green-600">{spotsRemaining}</p>
                  </div>
                </div>

                {event.registrationCount >= event.capacity && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-4">
                    <p className="text-sm font-semibold text-orange-900">
                      Event is at full capacity
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
