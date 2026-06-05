import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AttendeeLogin() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const loginMutation = trpc.attendees.login.useMutation({
    onSuccess: (data) => {
      // Store attendee ID in localStorage
      localStorage.setItem("attendeeId", JSON.stringify(data.id));
      localStorage.setItem("attendeeName", JSON.stringify(data.name));
      toast.success("Logged in successfully!");
      setLocation("/attendee/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Login failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    if (!formData.password) {
      toast.error("Please enter your password");
      return;
    }

    loginMutation.mutate({
      email: formData.email,
      password: formData.password,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center py-8 md:py-12 px-4">
      <Card className="w-full max-w-md border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">Attendee Login</CardTitle>
          <CardDescription className="text-sm md:text-base">
            Sign in to view and manage your event registrations
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-sm">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loginMutation.isPending}
                className="mt-1 h-10 md:h-11 text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password" className="text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={loginMutation.isPending}
                className="mt-1 h-10 md:h-11 text-sm"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 md:h-11 mt-4 md:mt-6 text-sm md:text-base"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            {/* Register Link */}
            <div className="text-center text-xs md:text-sm">
              <span className="text-slate-600">Don't have an account? </span>
              <button
                type="button"
                onClick={() => setLocation("/attendee/register")}
                className="text-blue-600 hover:underline font-semibold"
              >
                Register
              </button>
            </div>
          </form>

          {/* Back to Home */}
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="w-full mt-3 md:mt-4 text-slate-600 h-10 md:h-11 text-sm"
          >
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
