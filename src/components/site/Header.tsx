import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, LogOut, ShieldCheck, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/fleet", label: "Fleet" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const checkAdmin = async (uid: string | undefined) => {
      if (!uid) return setIsAdmin(false);
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    };
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
      checkAdmin(data.user?.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setUserEmail(session?.user?.email ?? null);
        checkAdmin(session?.user?.id);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "bg-background/85 backdrop-blur-md border-b border-border" : "bg-transparent",
      )}
    >
      <div className="container mx-auto flex items-center justify-between px-4 md:px-8 h-20">
        <Link to="/" className="flex flex-col leading-tight group" aria-label="Oma Trans INC — South Shore Limo Boston home">
          <span className="font-display text-lg md:text-xl tracking-wide text-silver-bright leading-tight">
            SOUTH SHORE <span className="text-primary italic">Limo</span> BOSTON
          </span>
          <span className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-primary/80">by Oma Trans INC</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-medium text-silver hover:text-silver-bright transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link to={userEmail ? (isAdmin ? "/admin" : "/my-bookings") : "/auth"} aria-label={userEmail ? (isAdmin ? "Admin dashboard" : "My bookings") : "Sign in"}>
            <Button variant="outline" size="sm" className="border-primary/40 text-primary hover:bg-primary/10">
              {isAdmin ? <ShieldCheck className="size-4 mr-2" /> : <LogIn className="size-4 mr-2" />}
              {userEmail ? (isAdmin ? "Admin" : "Account") : "Sign in"}
            </Button>
          </Link>
          {userEmail && (
            <>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-silver" aria-label="Sign out">
                <LogOut className="size-4" />
              </Button>
            </>
          )}
          <Link to="/booking">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground tracking-wider">
              BOOK NOW
            </Button>
          </Link>
        </div>

        <button
          className="lg:hidden text-silver"
          aria-label="Toggle menu"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden bg-background/95 backdrop-blur-md border-t border-border">
          <div className="container mx-auto flex flex-col gap-1 px-4 py-4">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="px-3 py-3 text-silver hover:text-silver-bright"
              >
                {l.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-3 border-t border-border mt-2">
              <Link to={userEmail ? (isAdmin ? "/admin" : "/my-bookings") : "/auth"} onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full">
                  {isAdmin ? <ShieldCheck className="size-4 mr-2" /> : <LogIn className="size-4 mr-2" />}
                  {userEmail ? (isAdmin ? "Admin" : "Account") : "Sign in"}
                </Button>
              </Link>
              {userEmail && (
                <>
                  <Button variant="ghost" onClick={handleSignOut}>Sign out</Button>
                </>
              )}
              <Link to="/booking" onClick={() => setOpen(false)}>
                <Button className="w-full bg-primary hover:bg-primary/90">BOOK NOW</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
