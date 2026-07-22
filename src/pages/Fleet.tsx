import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Users, Briefcase as Bag } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listVehicles } from "@/lib/vehicles";
import { VehicleImage } from "@/components/site/VehicleImage";
import { useSeo } from "@/lib/useSeo";

export default function Fleet() {
  useSeo({
    title: "Fleet — South Shore Limo Boston",
    description: "South Shore Limo Boston fleet: executive sedans, luxury SUVs (Cadillac Escalade, Lincoln Navigator), stretch limousines and Mercedes Sprinter vans.",
  });
  const { data: vehicles = [], isLoading, error } = useQuery({ queryKey: ["vehicles"], queryFn: listVehicles });
  return (
    <>
      <Header />
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-2xl">
            <p className="text-xs tracking-[0.3em] text-primary uppercase">South Shore Limo Boston — The Fleet</p>
            <h1 className="mt-3 font-display text-5xl md:text-6xl text-silver-bright">
              Curated, never <span className="italic">compromised</span>
            </h1>
            <p className="mt-6 text-muted-foreground text-lg">Late-model vehicles, immaculately maintained, with chauffeurs to match.</p>
          </div>

          {error ? (
            <p className="mt-12 text-destructive">{(error as Error).message}</p>
          ) : isLoading ? (
            <p className="mt-12 text-muted-foreground">Loading…</p>
          ) : (
            <div className="mt-16 grid md:grid-cols-2 gap-6">
              {vehicles.map((v) => (
                <Card key={v.id} className="overflow-hidden p-0 bg-card/60 hover:border-primary/50 transition-all">
                  <div className="aspect-[16/10] overflow-hidden">
                    <VehicleImage imagePath={v.image_url} category={v.category} alt={v.name} className="size-full object-cover" />
                  </div>
                  <div className="p-8">
                    <p className="text-xs tracking-[0.2em] text-primary uppercase">{v.category}</p>
                    <h3 className="mt-2 font-display text-3xl text-silver-bright">{v.name}</h3>
                    <p className="mt-3 text-muted-foreground">{v.description}</p>
                    <div className="mt-6 flex items-center gap-6 text-sm text-silver">
                      <span className="flex items-center gap-2"><Users className="size-4 text-primary" /> {v.capacity_passengers} pax</span>
                      <span className="flex items-center gap-2"><Bag className="size-4 text-primary" /> {v.capacity_luggage} bags</span>
                      <span className="ml-auto text-primary font-medium">${Number(v.per_km_rate).toFixed(2)} / mile</span>
                    </div>
                    <Link to={`/booking?vehicle=${v.id}`} className="block mt-6">
                      <Button className="w-full bg-primary hover:bg-primary/90 tracking-wider">Reserve this vehicle</Button>
                    </Link>
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
