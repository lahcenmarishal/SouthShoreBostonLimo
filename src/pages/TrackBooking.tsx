import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Search, CheckCircle2, Clock, CircleSlash, Flag } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useSeo } from "@/lib/useSeo";

type TrackedBooking = {
  id: string;
  reference: string;
  created_at: string;
  pickup_at: string;
  pickup_location: string;
  dropoff_location: string;
  transfer_type: string;
  passengers: number;
  luggage: number;
  extra_wait_hours: number;
  estimated_km: number;
  estimated_price: number;
  price_source: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  customer_name: string;
  vehicle_name: string | null;
};

const steps = [
  { key: "pending", label: "Request received", Icon: Clock },
  { key: "confirmed", label: "Confirmed", Icon: CheckCircle2 },
  { key: "completed", label: "Completed", Icon: Flag },
] as const;

const statusVariant = (s: string) =>
  s === "confirmed" ? "default" : s === "completed" ? "secondary" : s === "cancelled" ? "destructive" : "outline";

export default function TrackBooking() {
  useSeo({
    title: "Track your booking — South Shore Limo Boston",
    description: "Follow the status of your South Shore Limo Boston reservation request with your email and phone number.",
  });

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<TrackedBooking[] | null>(null);

  const search = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("track-booking", {
        body: { email, phone },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setResults((data?.bookings ?? []) as TrackedBooking[]);
    } catch (e) {
      setError((e as Error).message || "We could not load your requests. Please try again.");
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <p className="text-xs tracking-[0.3em] text-primary uppercase">Your reservations</p>
          <h1 className="mt-3 font-display text-4xl md:text-5xl text-silver-bright">Track your request</h1>
          <p className="mt-4 text-muted-foreground">
            Enter the email and phone number you used when booking to see where your request stands.
          </p>

          <Card className="mt-10 p-6 bg-card/60">
            <form
              className="grid sm:grid-cols-[1fr_1fr_auto] gap-4 items-end"
              onSubmit={(e) => {
                e.preventDefault();
                search();
              }}
            >
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-silver">Email</Label>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-silver">Phone</Label>
                <Input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(774) 434-5351" />
              </div>
              <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
                <Search className="size-4 mr-2" /> {loading ? "Searching…" : "Find my request"}
              </Button>
            </form>
            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
          </Card>

          {results && results.length === 0 && (
            <Card className="mt-8 p-10 text-center bg-card/60">
              <CircleSlash className="size-8 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No request found with this email and phone number.</p>
              <Link to="/booking">
                <Button className="mt-6 bg-primary hover:bg-primary/90">Make a booking</Button>
              </Link>
            </Card>
          )}

          {results && results.length > 0 && (
            <div className="mt-8 space-y-4">
              {results.map((b) => {
                const activeIndex = steps.findIndex((s) => s.key === b.status);
                return (
                  <Card key={b.id} className="p-6 bg-card/60">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs tracking-[0.2em] text-primary uppercase">Ref {b.reference}</p>
                        <p className="mt-1 font-display text-xl text-silver-bright">
                          {b.pickup_location} → {b.dropoff_location}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {format(new Date(b.pickup_at), "PPP 'at' p")} · {b.transfer_type.replace("_", " ")}
                          {b.vehicle_name ? ` · ${b.vehicle_name}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-display text-2xl text-silver-bright">${Number(b.estimated_price).toFixed(0)}</span>
                        <Badge variant={statusVariant(b.status)}>{b.status}</Badge>
                      </div>
                    </div>

                    {b.status === "cancelled" ? (
                      <p className="mt-6 text-sm text-destructive">This request was cancelled. Call us if this is unexpected.</p>
                    ) : (
                      <div className="mt-6 grid sm:grid-cols-3 gap-3">
                        {steps.map((s, i) => (
                          <div
                            key={s.key}
                            className={
                              "rounded-lg border p-3 flex items-center gap-3 " +
                              (i <= activeIndex ? "border-primary/50 bg-primary/5" : "border-border")
                            }
                          >
                            <s.Icon className={"size-5 " + (i <= activeIndex ? "text-primary" : "text-muted-foreground")} />
                            <span className={"text-sm " + (i <= activeIndex ? "text-silver-bright" : "text-muted-foreground")}>
                              {s.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-6 grid sm:grid-cols-3 gap-3 text-sm text-muted-foreground">
                      <p>Passengers: {b.passengers}</p>
                      <p>Luggage: {b.luggage}</p>
                      <p>Distance: {Number(b.estimated_km).toFixed(1)} miles</p>
                      {Number(b.extra_wait_hours) > 0 && <p>Extra waiting: {b.extra_wait_hours} h</p>}
                      <p>Requested on {format(new Date(b.created_at), "PPP")}</p>
                      <p>{b.price_source === "zone" ? "Fixed route rate" : "Per-mile estimate"}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
