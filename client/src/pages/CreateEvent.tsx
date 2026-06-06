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
import ImageUploadInput from "@/components/ImageUploadInput";

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const uploadImageMutation = trpc.events.uploadImage.useMutation();

  const createEventMutation = trpc.events.create.useMutation({
    onSuccess: async (event) => {
      if (imageFile) {
        setIsUploadingImage(true);
        try {
          const reader = new FileReader();
          reader.onload = async (e) => {
            const base64 = (e.target?.result as string).split(",")[1];
            await uploadImageMutation.mutateAsync({
              eventId: event.id,
              imageData: base64,
              fileName: imageFile.name,
            });
            toast.success("Event created with banner!");
            setLocation(`/host/dashboard`);
          };
          reader.readAsDataURL(imageFile);
        } catch (error: any) {
          toast.error("Event created but image upload failed");
          setLocation(`/host/dashboard`);
        } finally {
          setIsUploadingImage(false);
        }
      } else {
        toast.success("Event created successfully!");
        setLocation(`/host/dashboard`);
      }
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center py-8 md:py-12 px-4">
        <Card className="w-full max-w-md border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Create Event</CardTitle>
            <CardDescription className="text-sm md:text-base">Please log in to create an event</CardDescription>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 md:py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="border-slate-200">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl md:text-3xl">Create New Event</CardTitle>
            <CardDescription className="text-sm md:text-base">
              Fill in the details below to create your event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Event Title *
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="e.g., Tech Conference 2024"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="h-10 md:h-11 text-sm md:text-base"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your event..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="min-h-24 text-sm md:text-base"
                />
              </div>

              {/* Event Banner Image */}
              <ImageUploadInput
                value={imagePreview || undefined}
                onChange={setImageFile}
                onPreviewChange={setImagePreview}
                disabled={createEventMutation.isPending || isUploadingImage}
              />

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium">
                  Location *
                </Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="e.g., San Francisco Convention Center"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="h-10 md:h-11 text-sm md:text-base"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Category
                </Label>
                <Input
                  id="category"
                  type="text"
                  placeholder="e.g., Technology, Business, Entertainment"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="h-10 md:h-11 text-sm md:text-base"
                />
              </div>

              {/* Event Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-medium">
                    Event Date *
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="h-10 md:h-11 text-sm md:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time" className="text-sm font-medium">
                    Event Time *
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="h-10 md:h-11 text-sm md:text-base"
                  />
                </div>
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <Label htmlFor="capacity" className="text-sm font-medium">
                  Event Capacity *
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  placeholder="e.g., 100"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="h-10 md:h-11 text-sm md:text-base"
                />
              </div>

              {/* Registration Cutoff */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Registration Cutoff *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cutoffDate" className="text-xs text-slate-600">
                      Cutoff Date
                    </Label>
                    <Input
                      id="cutoffDate"
                      type="date"
                      value={formData.registrationCutoffDate}
                      onChange={(e) => setFormData({ ...formData, registrationCutoffDate: e.target.value })}
                      className="h-10 md:h-11 text-sm md:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cutoffTime" className="text-xs text-slate-600">
                      Cutoff Time
                    </Label>
                    <Input
                      id="cutoffTime"
                      type="time"
                      value={formData.registrationCutoffTime}
                      onChange={(e) => setFormData({ ...formData, registrationCutoffTime: e.target.value })}
                      className="h-10 md:h-11 text-sm md:text-base"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/host/dashboard")}
                  className="flex-1 h-10 md:h-11 text-sm md:text-base"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createEventMutation.isPending || isUploadingImage}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10 md:h-11 text-sm md:text-base"
                >
                  {createEventMutation.isPending || isUploadingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isUploadingImage ? "Uploading..." : "Creating..."}
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
