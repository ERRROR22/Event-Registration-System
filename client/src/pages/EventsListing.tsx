import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Calendar, MapPin, Users, Search, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function EventsListing() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: events, isLoading } = trpc.events.getUpcoming.useQuery({ limit: 100 });

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    return events.filter(event =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [events, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Upcoming Events</h1>
              <p className="text-sm sm:text-base text-slate-600 mt-1 md:mt-2">Discover and register for amazing events</p>
            </div>
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Back Home
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 sm:h-11 bg-slate-50 border-slate-200 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12 md:py-16">
            <Calendar className="w-12 md:w-16 h-12 md:h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">No events found</h3>
            <p className="text-sm md:text-base text-slate-600">
              {searchQuery ? "Try adjusting your search criteria" : "Check back soon for upcoming events"}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredEvents.map((event) => {
              const eventDate = new Date(event.date);
              const cutoffDate = new Date(event.registrationCutoffDate);
              const now = new Date();
              const isCutoffPassed = now > cutoffDate;
              const isEventPassed = now > eventDate;
              // Use 0 as default for registration count since we'll fetch it separately
              const registrationCount = (event as any).registrationCount || 0;
              const isFull = registrationCount >= event.capacity;

              return (
                <Card
                  key={event.id}
                  className="border-slate-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  onClick={() => setLocation(`/events/${event.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                        {event.title}
                      </CardTitle>
                      {event.category && (
                        <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {event.category}
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

                    {/* Location */}
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{event.location}</span>
                    </div>

                    {/* Capacity */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">
                          {registrationCount} / {event.capacity} registered
                        </span>
                      </div>
                      <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all"
                          style={{
                            width: `${Math.min((registrationCount / event.capacity) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex gap-2 flex-wrap pt-2">
                      {isEventPassed && (
                        <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-1 rounded">
                          Past Event
                        </span>
                      )}
                      {isFull && !isEventPassed && !isCutoffPassed && (
                        <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-1 rounded">
                          Full
                        </span>
                      )}
                      {isCutoffPassed && !isEventPassed && (
                        <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-1 rounded">
                          Registration Closed
                        </span>
                      )}
                      {!isCutoffPassed && !isEventPassed && !isFull && (
                        <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded">
                          Open
                        </span>
                      )}
                    </div>

                    {/* CTA Button */}
                    <Button
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white group-hover:gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/events/${event.id}`);
                      }}
                    >
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
