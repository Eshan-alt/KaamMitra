import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, Link } from "wouter";
import type { ComponentType } from "react";

type ProtectedRouteProps = {
  path: string;
  component: ComponentType;
  userType?: "worker" | "employer" | "admin";
};

export function ProtectedRoute({
  path,
  component: Component,
  userType,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-2xl font-bold text-center mb-4">Login Required</h1>
          <p className="text-muted-foreground text-center mb-6">
            You need to log in to access this page.
          </p>
          <div className="flex space-x-4">
            <Link href="/login" className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">
              Login
            </Link>
            <Link href="/register" className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">
              Register
            </Link>
          </div>
        </div>
      </Route>
    );
  }

  if (userType && user.userType !== userType) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-2xl font-bold text-center mb-4">Access Denied</h1>
          <p className="text-muted-foreground text-center mb-6">
            You don't have permission to access this page. This page is only for {userType}s.
          </p>
          <Link 
            href={
              user.userType === "worker"
                ? "/worker-dashboard"
                : user.userType === "employer"
                  ? "/employer-dashboard"
                  : "/admin-dashboard"
            }
            className="text-primary hover:underline"
          >
            Go to your dashboard
          </Link>
        </div>
      </Route>
    );
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}