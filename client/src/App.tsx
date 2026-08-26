import { Redirect, Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import Login from "@/pages/login";
import Register from "@/pages/register";
import VerificationPage from "@/pages/verification-page";
import AdminPage from "@/pages/admin-page";
import PaymentDemo from "@/pages/payment-demo";
import MessagingPage from "@/pages/messaging-page";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { ComponentType, ReactElement } from "react";
import ErrorBoundary from "./components/ui/error-boundary";
import WorkerDashboard from "./pages/dashboard/worker-dashboard";
import EmployerDashboard from "./pages/dashboard/employer-dashboard";
import JobDetails from "./pages/jobs/job-details";
import PostJob from "./pages/jobs/post-job";
import WorkerProfile from "./pages/workers/worker-profile";
import { Chatbot } from "@/components/ui/chatbot";
import { ThemeProvider } from "@/components/theme-provider";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/">
        {() => <HomePage />}
      </Route>
      <Route path="/auth">
        {() => <Redirect to="/login" />}
      </Route>
      <Route path="/login">
        {() => <Login />}
      </Route>
      <Route path="/register">
        {() => <Register />}
      </Route>
      <Route path="/jobs/:id">
        {() => <JobDetails />}
      </Route>
      <Route path="/workers/:id">
        {() => <WorkerProfile />}
      </Route>
      
      {/* Protected routes */}
      <ProtectedRoute path="/worker-dashboard" component={WorkerDashboard} userType="worker" />
      <ProtectedRoute path="/employer-dashboard" component={EmployerDashboard} userType="employer" />
      <ProtectedRoute path="/post-job" component={PostJob} userType="employer" />
      <ProtectedRoute path="/verification" component={VerificationPage} />
      <ProtectedRoute path="/messaging" component={MessagingPage} />
      <ProtectedRoute path="/messaging/:id" component={MessagingPage} />
      <ProtectedRoute path="/payment-demo" component={PaymentDemo} />
      <ProtectedRoute path="/admin-dashboard" component={AdminPage} userType="admin" />
      
      {/* 404 catchall route */}
      <Route path="/:rest*">
        {() => <NotFound />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Router />
            <Chatbot />
            <Toaster />
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
