import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Skeleton } from "@/components/ui/skeleton";
import ImageUploadInput from "@/components/ImageUploadInput";

export default function EditEvent() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, loading: authLoading } = useAuth();
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const { data: event, isLoading } = trpc.events.getById.useQuery(parseInt(id || "0"), {
    enabled: !!id,
  });

  const uploadImageMutation = trpc.events.uploadImage.useMutation();

  const updateEventMutation = trpc.events.update.useMutation({
    onSuccess: async (updatedEvent) => {
      if (imageFile && updatedEvent) {
        setIsUploadingImage(true);
        try {
          const reader = new FileReader();
          const base64String = await new Promise<string>((resolve, reject) => {
            reader.onload = (e) => {
              const result = e.target?.result as string;
              resolve(result.split(",")[1]);
            };
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(imageFile);
          });

          await uploadImageMutation.mutateAsync({
            eventId: updatedEvent.id,
            imageData: base64String,
            fileName: imageFile.name,
          });
          toast.success("Event updated with new banner!");
          setLocation(`/host/dashboard`);
        } catch (error: any) {
          toast.error("Event updated but image upload failed");
          setLocation(`/host/dashboard`);
        } finally {
          setIsUploadingImage(false);
        }
      } else {
        toast.success("Event updated successfully!");
        setLocation(`/host/dashboard`);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update event");
    },
  });

  useEffect(() => {
    if (event) {
      const eventDate = new Date(event.date);
      const cutoffDate = new Date(event.registrationCutoffDate);

      setFormData({
        title: event.title,
        description: event.description || "",
        location: event.location,
        date: eventDate.toISOString().split("T")[0],
        time: eventDate.toTimeString().slice(0, 5),
        capacity: event.capacity.toString(),
        registrationCutoffDate: cutoffDate.toISOString().split("T")[0],
        registrationCutoffTime: cutoffDate.toTimeString().slice(0, 5),
        category: event.category || "",
      });
    }
  }, [event]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 md:py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-slate-200">
            <CardHeader>
              <Skeleton className="h-8 md:h-10 w-1/2 mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              <Skeleton className="h-10 md:h-11" />
              <Skeleton className="h-20 md:h-24" />
              <Skeleton className="h-10 md:h-11" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md border-slate-200">
          <CardHeader>
            <CardTitle>Edit Event</CardTitle>
            <CardDescription>Please log in to edit an event</CardDescription>
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

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Event not found</h1>
          <Button onClick={() => setLocation("/host/dashboard")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
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

    updateEventMutation.mutate({
      id: event.id,
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
            <CardTitle className="text-3xl">Edit Event</CardTitle>
            <CardDescription>
              Update the details for your event
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
                  disabled={updateEventMutation.isPending}
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
                  disabled={updateEventMutation.isPending}
                  rows={4}
                  className="mt-1"
                />
              </div>

              {/* Event Banner Image */}
              <ImageUploadInput
                value={imagePreview || event?.imageUrl || undefined}
                onChange={setImageFile}
                onPreviewChange={setImagePreview}
                disabled={updateEventMutation.isPending || isUploadingImage}
              />

              {/* Location */}
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="San Francisco, CA"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={updateEventMutation.isPending}
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
                  disabled={updateEventMutation.isPending}
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
                    disabled={updateEventMutation.isPending}
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
                    disabled={updateEventMutation.isPending}
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
                  disabled={updateEventMutation.isPending}
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
                      disabled={updateEventMutation.isPending}
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
                      disabled={updateEventMutation.isPending}
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
                  disabled={updateEventMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {updateEventMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Event"
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
