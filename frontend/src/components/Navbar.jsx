import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Swords } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const getRatingColor = (rating) => {
  if (!rating) return "text-gray-400";
  if (rating < 1200) return "text-gray-400"; 
  if (rating < 1400) return "text-green-500"; 
  if (rating < 1600) return "text-[#03a89e]"; 
  if (rating < 1900) return "text-blue-500"; 
  if (rating < 2100) return "text-purple-500"; 
  if (rating < 2300) return "text-orange-400"; 
  if (rating < 2400) return "text-orange-500"; 
  if (rating < 2600) return "text-red-500"; 
  return "text-red-600";
};

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRating, setUserRating] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = sessionStorage.getItem("token");
      setIsLoggedIn(!!token);

      if (token) {
        try {
           const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`, {
             headers: { Authorization: `Bearer ${token}` }
           });
           const data = await res.json();
           if (data.rating) setUserRating(data.rating);
        } catch(e) {}
      } else {
        setUserRating(null);
      }
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
              <Link href="/practice">
                <Button variant="ghost" size="sm" className="hidden md:inline-flex">
                  Practice
                </Button>
              </Link>
              <Link href="/leaderboard">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                  Leaderboard
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
              {userRating && (
                <div className={`hidden md:flex ml-2 px-3 py-1 rounded border border-border/50 bg-card/50 font-mono text-sm font-bold ${getRatingColor(userRating)}`}>
                   {userRating}
                </div>
              )}
              <Button variant="default" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/leaderboard">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                  Leaderboard
                </Button>
              </Link>
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
