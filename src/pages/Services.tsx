import { Plane, Briefcase, Heart, Calendar, Clock, Building2 } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { useSeo } from "@/lib/useSeo";

const services = [
  { Icon: Plane, t: "Airport transfers", d: "Flight tracking, meet-and-greet at arrivals, luggage handled. Logan, JFK, LaGuardia, Newark — we know the routes." },
  { Icon: Briefcase, t: "Corporate", d: "Recurring rides for executives, client pickups, roadshows. Monthly invoicing available for businesses." },
  { Icon: Heart, t: "Weddings", d: "Ribboned arrival, decorated interior, photo stops included. Stretch limousine or executive sedan for the couple." },
  { Icon: Calendar, t: "Special events", d: "Galas, premieres, milestone birthdays, anniversaries. Door-to-door luxury for the moments that matter." },
  { Icon: Clock, t: "Hourly service", d: "Reserve a car and chauffeur by the hour. Ideal for shopping, multiple stops, or all-day events." },
  { Icon: Building2, t: "City tours", d: "Private guided tours of the city in complete comfort. Custom routes available on request." },
];

export default function Services() {
  useSeo({
    title: "Services — South Shore Limo Boston",
    description: "South Shore Limo Boston services: Logan airport transfers, corporate transport, weddings, special events, hourly chauffeur and city tours.",
  });
  return (
    <>
      <Header />
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-2xl">
            <p className="text-xs tracking-[0.3em] text-primary uppercase">Services</p>
            <h1 className="mt-3 font-display text-5xl md:text-6xl text-silver-bright">
              Every <span className="italic">occasion</span>, considered
            </h1>
            <p className="mt-6 text-muted-foreground text-lg">One service, many shapes. Whatever the journey, we have a car and a chauffeur for it.</p>
          </div>
          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <Card key={s.t} className="p-8 bg-card/60 hover:border-primary/50 transition-all">
                <s.Icon className="size-10 text-primary mb-5" />
                <h3 className="font-display text-2xl text-silver-bright">{s.t}</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">{s.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
