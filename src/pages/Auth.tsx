import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useSeo } from "@/lib/useSeo";

export default function Auth() {
  useSeo({
    title: "Admin sign in — Ride Chic",
    description: "Admin sign in for Ride Chic staff.",
    noindex: true,
  });
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate("/admin", { replace: true });
    });
  }, [navigate]);

  const signIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate("/admin", { replace: true });
  };

  return (
    <>
      <Header />
      <main className="pt-32 pb-24 min-h-screen">
        <div className="container mx-auto px-4 md:px-8 max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl text-silver-bright">
              Admin <span className="italic text-primary">sign in</span>
            </h1>
            <p className="mt-2 text-muted-foreground text-sm">Staff access only.</p>
          </div>

          <Card className="p-6 bg-card/80 space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && email && password) signIn(); }} />
            </div>
            <Button onClick={signIn} disabled={loading || !email || !password} className="w-full bg-primary hover:bg-primary/90">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
