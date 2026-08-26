import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Bell, Menu, Moon, Sun, X } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { NotificationsCenter } from "@/components/notifications/notifications-center";
import { useTheme } from "@/components/theme-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userInitials = user ? user.fullName.split(' ').map(n => n[0]).join('') : '';
  const dashboardPath = user?.userType === "worker"
    ? "/worker-dashboard"
    : user?.userType === "employer"
      ? "/employer-dashboard"
      : "/admin-dashboard";

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navLinks = [
    { href: "/#how-it-works", label: "How It Works" },
    { href: "/#for-workers", label: "For Workers" },
    { href: "/#for-employers", label: "For Employers" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/">
          <div className="cursor-pointer">
            <BrandLogo />
          </div>
        </Link>

        <div className="hidden md:flex space-x-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-neutral-700 hover:text-primary"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {user && <NotificationsCenter />}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          {user ? (
            <>
              {user.userType === "employer" && (
                <Button
                  variant="outline"
                  className="hidden md:inline-flex"
                  asChild
                >
                  <Link href="/post-job">Post a Job</Link>
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-white">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="font-medium">
                    {user.fullName}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={dashboardPath}>
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/verification">
                      Verify Account {user.verificationStatus === "verified" && "✓"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center">
              <Link href="/login">
                <Button variant="outline" className="mr-2">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Register</Button>
              </Link>
            </div>
          )}

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="p-0 h-9 w-9 rounded-full md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80%] sm:w-[350px]">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <BrandLogo />
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      className="p-0 h-9 w-9 rounded-full"
                    >
                      <X className="h-5 w-5" />
                      <span className="sr-only">Close menu</span>
                    </Button>
                  </SheetTrigger>
                </div>
                
                <div className="space-y-4 py-4">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="block py-2 text-neutral-700 hover:text-primary"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </a>
                  ))}
                  
                  {user ? (
                    <>
                      <Link
                        href={dashboardPath}
                        className="block py-2 text-neutral-700 hover:text-primary"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/verification"
                        className="block py-2 text-neutral-700 hover:text-primary"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Verify Account {user.verificationStatus === "verified" && "✓"}
                      </Link>
                      {user.userType === "employer" && (
                        <Link
                          href="/post-job"
                          className="block py-2 text-neutral-700 hover:text-primary"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Post a Job
                        </Link>
                      )}
                      <Button
                        variant="ghost"
                        className="w-full justify-start px-2"
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                      >
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="block py-2 text-neutral-700 hover:text-primary"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Login
                      </Link>
                      <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full mt-4">Register</Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
