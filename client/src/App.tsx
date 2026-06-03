import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import HostDashboard from "./pages/HostDashboard";
import CreateEvent from "./pages/CreateEvent";
import EditEvent from "./pages/EditEvent";
import EventDetail from "./pages/EventDetail";
import EventsListing from "./pages/EventsListing";
import AttendeeRegister from "./pages/AttendeeRegister";
import AttendeeLogin from "./pages/AttendeeLogin";
import AttendeeDashboard from "./pages/AttendeeDashboard";
import HostEventDetail from "./pages/HostEventDetail";

function Router() {
  return (
    <Switch>
      {/* Public pages */}
      <Route path={"/"} component={Home} />
      <Route path={"/events"} component={EventsListing} />
      <Route path={"/events/:id"} component={EventDetail} />
      
      {/* Host pages */}
      <Route path={"/host/dashboard"} component={HostDashboard} />
      <Route path={"/host/events/create"} component={CreateEvent} />
      <Route path={"/host/events/:id/edit"} component={EditEvent} />
      <Route path={"/host/events/:id"} component={HostEventDetail} />
      
      {/* Attendee pages */}
      <Route path={"/attendee/register"} component={AttendeeRegister} />
      <Route path={"/attendee/login"} component={AttendeeLogin} />
      <Route path={"/attendee/dashboard"} component={AttendeeDashboard} />
      
      {/* 404 */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
