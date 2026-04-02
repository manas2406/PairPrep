import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Swords } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = sessionStorage.getItem("token");
      setIsLoggedIn(!!token);
    };

    checkAuth();
    // Listen for storage events (e.g., login/logout in other tabs)
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
    };
  }, [router.pathname]); // Re-check when route changes as well

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    setIsLoggedIn(false);
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative">
            <Swords className="h-8 w-8 text-primary transition-all duration-300 group-hover:text-glow" />
            <div className="absolute inset-0 blur-lg bg-primary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            Pair<span className="text-primary">Prep</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Button variant="default" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="default" size="sm">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
