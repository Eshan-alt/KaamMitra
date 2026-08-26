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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Link } from "wouter";
import { registerSchema } from "@/hooks/use-auth";

export default function Register() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const requestedUserType = searchParams.get("type");
  const [userType, setUserType] = useState<"worker" | "employer">(
    requestedUserType === "employer" ? "employer" : "worker"
  );
  
  const { user, registerMutation } = useAuth();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const redirectPath =
        user.userType === "worker"
          ? "/worker-dashboard"
          : user.userType === "employer"
            ? "/employer-dashboard"
            : "/admin-dashboard";
      setLocation(redirectPath);
    }
  }, [user, setLocation]);

  // Register form setup
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      phone: "",
      email: "",
      location: "",
      userType,
      primarySkill: userType === "worker" ? "construction" : undefined,
    },
  });
  
  // Update form when userType changes
  const handleUserTypeChange = (type: "worker" | "employer") => {
    setUserType(type);
    registerForm.setValue("userType", type);
    if (type === "worker") {
      registerForm.setValue("primarySkill", "construction");
    } else {
      registerForm.unregister("primarySkill");
    }
  };
  
  const handleRegister = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(data);
  };

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
  
  const skillOptions = [
    { value: "construction", label: "Construction Worker" },
    { value: "plumbing", label: "Plumber" },
    { value: "electrical", label: "Electrician" },
    { value: "carpentry", label: "Carpenter" },
    { value: "painting", label: "Painter" },
    { value: "housekeeping", label: "Housekeeping" },
    { value: "gardening", label: "Gardener" },
    { value: "other", label: "Other" },
  ];
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
            {/* Left Side - Register Form */}
            <Card className="w-full shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">
                  Join Kaam Mitra
                </CardTitle>
                <CardDescription className="text-center">
                  Create an account to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center mb-6">
                  <div className="inline-flex rounded-md shadow-sm">
                    <Button
                      variant={userType === "worker" ? "default" : "outline"}
                      className={`rounded-l-md ${userType === "worker" ? "bg-primary" : ""}`}
                      onClick={() => handleUserTypeChange("worker")}
                      type="button"
                    >
                      I'm a Worker
                    </Button>
                    <Button
                      variant={userType === "employer" ? "default" : "outline"}
                      className={`rounded-r-md ${userType === "employer" ? "bg-[#FFA500]" : ""}`}
                      onClick={() => handleUserTypeChange("employer")}
                      type="button"
                    >
                      I'm an Employer
                    </Button>
                  </div>
                </div>
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input autoComplete="name" placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                            <Input autoComplete="username" placeholder="Choose a username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>WhatsApp Number</FormLabel>
                            <FormControl>
                            <Input autoComplete="tel" placeholder="Your WhatsApp number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input autoComplete="email" placeholder="Enter your email" {...field} required />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="Area, City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {userType === "worker" && (
                      <FormField
                        control={registerForm.control}
                        name="primarySkill"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Skill</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your skill" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {skillOptions.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                            <Input type="password" autoComplete="new-password" placeholder="Create a password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                            <Input type="password" autoComplete="new-password" placeholder="Confirm your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex items-center mb-2">
                      <input 
                        type="checkbox" 
                        id="terms" 
                        className="mr-2"
                        required
                      />
                      <Label htmlFor="terms" className="text-sm">
                        I agree to the terms and conditions
                      </Label>
                    </div>
                    
                    <Button
                      type="submit"
                      className={userType === "worker" ? "w-full bg-primary" : "w-full bg-[#FFA500]"}
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating Account..." : `Register as ${userType === "worker" ? "Worker" : "Employer"}`}
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                      You'll receive a verification message to confirm your account
                    </p>
                    <div className="text-center mt-4">
                      <p className="text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/login" className="text-primary font-medium hover:underline">
                          Login here
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
                {userType === "worker"
                  ? "Find Great Jobs Near You"
                  : "Hire Skilled Workers in Your Area"
                }
              </h1>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="text-green-500 mr-3">✓</div>
                  <p className="text-lg">
                    {userType === "worker"
                      ? "Get notified about job opportunities in your locality"
                      : "Find verified workers with the skills you need"
                    }
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="text-green-500 mr-3">✓</div>
                  <p className="text-lg">
                    {userType === "worker"
                      ? "Build your reputation with ratings from employers"
                      : "Post jobs and connect with workers directly"
                    }
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="text-green-500 mr-3">✓</div>
                  <p className="text-lg">
                    {userType === "worker"
                      ? "Connect directly with employers through WhatsApp"
                      : "Rate workers and build a trusted network"
                    }
                  </p>
                </div>
              </div>
              <div className="mt-8">
                <img 
                  src={userType === "worker" 
                    ? "https://images.unsplash.com/photo-1541802645635-11f2286a7482?q=80&w=600&h=400&auto=format&fit=crop"
                    : "https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=600&h=400&auto=format&fit=crop"
                  } 
                  alt={userType === "worker" ? "Worker finding jobs" : "Employer hiring workers"}
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