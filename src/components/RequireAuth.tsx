import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function RequireAuth({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"loading" | "in" | "out">("loading");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setStatus(data.user ? "in" : "out");
    });
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }
  if (status === "out") return <Navigate to="/auth" replace />;
  return <>{children}</>;
}
