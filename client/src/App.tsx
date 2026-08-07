import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import AdminDashboardV2 from "@/pages/AdminDashboardV2";
import AccountManagement from "@/pages/AccountManagement";
import ConferenceAdmin from "@/pages/ConferenceAdmin";
import ConferenceContentAdmin from "@/pages/ConferenceContentAdmin";
import ConferenceWorkspaceHome from "@/pages/ConferenceWorkspaceHome";
import GameOperations from "@/pages/GameOperations";
import ScheduleVerification from "@/pages/ScheduleVerification";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import School from "@/pages/School";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfUse from "@/pages/TermsOfUse";
import ProtectedRoute from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";

function AuthLinkRedirect() {
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const type = hash.get("type");
    const isPasswordFlow = type === "invite" || type === "recovery";

    if (isPasswordFlow && window.location.pathname !== "/reset-password") {
      window.location.replace(`/reset-password${window.location.hash}`);
    }
  }, []);

  return null;
}

function PublicConferenceRedirect() {
  useEffect(() => {
    window.location.replace("/#standings");
  }, []);
  return null;
}

function PublicScheduleRedirect() {
  useEffect(() => {
    window.location.replace("/#schedules");
  }, []);
  return null;
}

function AdminDashboardRoute() {
  return (
    <ProtectedRoute>
      <AdminDashboardV2 />
    </ProtectedRoute>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/conference" component={PublicConferenceRedirect} />
      <Route path="/conference/tournaments" component={PublicConferenceRedirect} />
      <Route path="/login" component={Login} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/set-password" component={ResetPassword} />

      <Route path="/admin" component={AdminDashboardRoute} />
      <Route path="/conference-admin" component={AdminDashboardRoute} />
      <Route path="/conference-admin/dashboard" component={AdminDashboardRoute} />

      <Route path="/conference-admin/core" component={() => (
        <ProtectedRoute>
          <ConferenceAdmin />
        </ProtectedRoute>
      )} />
      <Route path="/conference-admin/tools" component={() => (
        <ProtectedRoute>
          <ConferenceWorkspaceHome />
        </ProtectedRoute>
      )} />
      <Route path="/conference-admin/games" component={() => (
        <ProtectedRoute>
          <GameOperations />
        </ProtectedRoute>
      )} />
      <Route path="/conference-admin/verify-schedule" component={() => (
        <ProtectedRoute>
          <ScheduleVerification />
        </ProtectedRoute>
      )} />
      <Route path="/conference-admin/content" component={() => (
        <ProtectedRoute>
          <ConferenceContentAdmin />
        </ProtectedRoute>
      )} />
      <Route path="/conference-admin/users" component={() => (
        <ProtectedRoute>
          <AccountManagement />
        </ProtectedRoute>
      )} />
      <Route path="/schools/:id" component={School} />
      <Route path="/sports/:sportId/calendar" component={PublicScheduleRedirect} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-use" component={TermsOfUse} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthLinkRedirect />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
