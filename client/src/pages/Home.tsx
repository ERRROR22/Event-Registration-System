import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Calendar, Users, Zap, ArrowRight, Menu, X } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState } from "react";

function NavBar({ user, isAuthenticated, logout, setLocation }: any) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">EventHub</h1>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/events")}
            className="text-slate-700 hover:text-slate-900"
          >
            Browse Events
          </Button>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">{user?.name}</span>
              <Button
                variant="outline"
                onClick={() => setLocation("/host/dashboard")}
                className="text-slate-700"
              >
                Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={logout}
                className="text-slate-600 hover:text-slate-900"
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => setLocation("/attendee/login")}
                className="text-slate-700 hover:text-slate-900"
              >
                Attendee Login
              </Button>
              <Button
                onClick={() => window.location.href = getLoginUrl()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Host Login
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6 text-slate-900" />
          ) : (
            <Menu className="w-6 h-6 text-slate-900" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 py-4 px-4 space-y-3">
          <Button
            variant="ghost"
            onClick={() => {
              setLocation("/events");
              setMobileMenuOpen(false);
            }}
            className="w-full text-left text-slate-700"
          >
            Browse Events
          </Button>

          {isAuthenticated ? (
            <>
              <div className="text-sm text-slate-600 px-3 py-2">{user?.name}</div>
              <Button
                variant="outline"
                onClick={() => {
                  setLocation("/host/dashboard");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-slate-700"
              >
                Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left text-slate-600"
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setLocation("/attendee/login");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left text-slate-700"
              >
                Attendee Login
              </Button>
              <Button
                onClick={() => {
                  window.location.href = getLoginUrl();
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Host Login
              </Button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <NavBar user={user} isAuthenticated={isAuthenticated} logout={logout} setLocation={setLocation} />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-32">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 mb-4 md:mb-6 leading-tight">
              Discover & Manage Events with Ease
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 mb-6 md:mb-8 leading-relaxed">
              Create memorable experiences. Whether you're hosting or attending, EventHub makes event management effortless and elegant.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Button
                onClick={() => setLocation("/events")}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white text-base md:text-lg h-11 md:h-12 w-full sm:w-auto"
              >
                Explore Events
                <ArrowRight className="ml-2 w-4 md:w-5 h-4 md:h-5" />
              </Button>
              <Button
                onClick={() => window.location.href = getLoginUrl()}
                size="lg"
                variant="outline"
                className="text-base md:text-lg h-11 md:h-12 w-full sm:w-auto"
              >
                Host an Event
              </Button>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl p-8 md:p-12 h-80 md:h-96 flex items-center justify-center">
              <Calendar className="w-24 md:w-32 h-24 md:h-32 text-blue-300" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 md:mb-4">Why Choose EventHub?</h3>
            <p className="text-lg sm:text-xl text-slate-600">Everything you need to create and manage successful events</p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Easy Creation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Create and manage events in minutes with our intuitive interface. Set capacity, dates, and registration deadlines effortlessly.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">Attendee Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track registrations, manage capacity limits, and export attendee lists as CSV for easy follow-up communication.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Smart Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Set registration deadlines, manage event dates, and automatically enforce capacity limits to ensure smooth operations.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 md:mb-6">Ready to Get Started?</h3>
          <p className="text-blue-100 text-base sm:text-lg mb-6 md:mb-8">
            Join thousands of event organizers who trust EventHub
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <Button
              onClick={() => setLocation("/events")}
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 text-base md:text-lg h-11 md:h-12 w-full sm:w-auto"
            >
              Browse Events
            </Button>
            <Button
              onClick={() => window.location.href = getLoginUrl()}
              size="lg"
              variant="outline"
              className="text-white border-white hover:bg-blue-600 text-base md:text-lg h-11 md:h-12 w-full sm:w-auto"
            >
              Create Event
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
            <div className="col-span-2 sm:col-span-1">
              <h4 className="font-bold text-white mb-3 text-sm">EventHub</h4>
              <p className="text-xs sm:text-sm">Making event management simple and elegant for everyone.</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3 text-sm">For Hosts</h4>
              <ul className="space-y-1 text-xs sm:text-sm">
                <li><a href="#" className="hover:text-white">Create Event</a></li>
                <li><a href="#" className="hover:text-white">Manage</a></li>
                <li><a href="#" className="hover:text-white">Export</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3 text-sm">For Attendees</h4>
              <ul className="space-y-1 text-xs sm:text-sm">
                <li><a href="#" className="hover:text-white">Browse</a></li>
                <li><a href="#" className="hover:text-white">Register</a></li>
                <li><a href="#" className="hover:text-white">My Events</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3 text-sm">Support</h4>
              <ul className="space-y-1 text-xs sm:text-sm">
                <li><a href="#" className="hover:text-white">Help</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 md:pt-8 text-center text-xs sm:text-sm">
            <p>&copy; 2026 EventHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
