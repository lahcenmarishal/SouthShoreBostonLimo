import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listMyBookings } from "@/lib/bookings";
import { useSeo } from "@/lib/useSeo";

const statusVariant = (s: string) =>
  s === "confirmed" ? "default" : s === "completed" ? "secondary" : s === "cancelled" ? "destructive" : "outline";

export default function MyBookings() {
  useSeo({ title: "My rides — Ride Chic", description: "Your Ride Chic reservations." });
  const { data = [], isLoading } = useQuery({ queryKey: ["my-bookings"], queryFn: listMyBookings });

  return (
    <>
      <Header />
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs tracking-[0.3em] text-primary uppercase">Account</p>
              <h1 className="mt-2 font-display text-4xl md:text-5xl text-silver-bright">My rides</h1>
            </div>
            <Link to="/booking"><Button className="bg-primary hover:bg-primary/90">New booking</Button></Link>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : data.length === 0 ? (
            <Card className="p-12 text-center bg-card/60">
              <p className="text-muted-foreground">You have no reservations yet.</p>
              <Link to="/booking"><Button className="mt-6 bg-primary hover:bg-primary/90">Book your first ride</Button></Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {data.map((b) => (
                <Card key={b.id} className="p-6 bg-card/60 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-silver-bright font-display text-lg">{b.pickup_location} → {b.dropoff_location}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(b.pickup_at), "PPP 'at' p")} · {b.transfer_type.replace("_", " ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-display text-2xl text-silver-bright">${Number(b.estimated_price).toFixed(0)}</span>
                    <Badge variant={statusVariant(b.status)}>{b.status}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
