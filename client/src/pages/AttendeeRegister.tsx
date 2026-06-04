import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AttendeeRegister() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const registerMutation = trpc.attendees.register.useMutation({
    onSuccess: (data) => {
      toast.success("Registration successful! You can now log in.");
      setLocation("/attendee/login");
    },
    onError: (error) => {
      toast.error(error.message || "Registration failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    registerMutation.mutate({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center py-8 md:py-12 px-4">
      <Card className="w-full max-w-md border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">Create Account</CardTitle>
          <CardDescription className="text-sm md:text-base">
            Register to discover and attend amazing events
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor="name" className="text-sm">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={registerMutation.isPending}
                className="mt-1 h-10 md:h-11 text-sm"
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-sm">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={registerMutation.isPending}
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
                disabled={registerMutation.isPending}
                className="mt-1 h-10 md:h-11 text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">At least 6 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                disabled={registerMutation.isPending}
                className="mt-1 h-10 md:h-11 text-sm"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 md:h-11 mt-4 md:mt-6 text-sm md:text-base"
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>

            {/* Login Link */}
            <div className="text-center text-xs md:text-sm">
              <span className="text-slate-600">Already have an account? </span>
              <button
                type="button"
                onClick={() => setLocation("/attendee/login")}
                className="text-blue-600 hover:underline font-semibold"
              >
                Log in
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
