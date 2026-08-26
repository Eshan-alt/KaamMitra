import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Link } from "wouter";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, loginMutation } = useAuth();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const redirectPath = user.userType === "worker" ? "/worker-dashboard" : "/employer-dashboard";
      setLocation(redirectPath);
    }
  }, [user, setLocation]);

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }
  
  // Login form setup
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  const handleLogin = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
            {/* Left Side - Login Form */}
            <Card className="w-full shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-center">
                  Sign in to your account to continue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input autoComplete="username" placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" autoComplete="current-password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                    <div className="text-center mt-4">
                      <p className="text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Link href="/register" className="text-primary font-medium hover:underline">
                          Register here
                        </Link>
                      </p>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* Right Side - Hero */}
            <div className="hidden lg:block p-6">
              <h1 className="text-4xl font-bold mb-6 text-primary">
                Welcome Back to Kaam Mitra
              </h1>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="text-green-500 mr-3">✓</div>
                  <p className="text-lg">
                    Access your dashboard to manage your jobs and applications
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="text-green-500 mr-3">✓</div>
                  <p className="text-lg">
                    Check your messages and notifications
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="text-green-500 mr-3">✓</div>
                  <p className="text-lg">
                    View your profile and update your information
                  </p>
                </div>
              </div>
              <div className="mt-8">
                <img 
                  src="https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=600&h=400&auto=format&fit=crop" 
                  alt="Worker and employer connection"
                  className="rounded-lg shadow-md"
                  width="600"
                  height="400"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}