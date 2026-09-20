import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Plane, Briefcase, Heart, Calendar, Clock, ShieldCheck, Star, ArrowRight } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { BookingWidget } from "@/components/site/BookingWidget";
import { VehicleImage } from "@/components/site/VehicleImage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSeo } from "@/lib/useSeo";
import { listVehicles } from "@/lib/vehicles";
import heroImg from "@/assets/fleet-hero.jpg";

const services = [
  { icon: Plane, title: "Airport transfers", desc: "Flight-tracked pickups, meet & greet, no rush.", slug: "airport-transfers" },
  { icon: Briefcase, title: "Corporate", desc: "Discreet executive transport for board meetings and clients.", slug: "corporate" },
  { icon: Heart, title: "Weddings", desc: "Arrive in style on the most important day.", slug: "weddings" },
  { icon: Calendar, title: "Special events", desc: "Galas, premieres, anniversaries — turn every arrival into a moment.", slug: "special-events" },
  { icon: Clock, title: "Hourly service", desc: "Reserve a chauffeur for the hour with full flexibility.", slug: "hourly-service" },
];

export default function Home() {
  useSeo({
    title: "South Shore Limo Boston — Premium Chauffeur & Limousine Service",
    description: "South Shore Limo Boston: book a premium chauffeur, executive sedan, SUV, Sprinter van or stretch limousine for Logan airport transfers, weddings and corporate events.",
    ogImage: heroImg,
  });
  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles"], queryFn: listVehicles });
  const featured = vehicles.slice(0, 3);
  return (
    <>
      <Header />
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24 pb-32">
        <img src={heroImg} alt="South Shore Limo Boston luxury fleet — Cadillac Escalade, Lincoln Navigator, stretch limousine, Mercedes Sprinter van and executive sedan" width={1920} height={1024} fetchPriority="high" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="container relative z-10 mx-auto px-4 md:px-8 text-center">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-xs md:text-sm tracking-[0.4em] text-silver uppercase">
            Arrive with distinction
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }} className="mt-4 font-display text-5xl md:text-7xl lg:text-8xl text-silver-bright leading-[1.05]">
            South Shore <span className="italic text-primary">Limo</span> Boston
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.4 }} className="mt-6 max-w-xl mx-auto text-muted-foreground text-base md:text-lg">
            Premium chauffeur and limousine service across Boston and the South Shore — for travelers who measure the journey in quiet comfort.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.6 }} className="mt-16">
            <BookingWidget />
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-8 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs tracking-[0.3em] text-primary uppercase">What we offer</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl text-silver-bright">A service shaped around <span className="italic">you</span></h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {services.map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}>
              <Link to={`/services#${s.slug}`} className="block h-full group" aria-label={`${s.title} — see details`}>
                <Card className="h-full p-6 bg-card/60 hover:bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-[var(--shadow-glow)] cursor-pointer">
                  <s.icon className="size-8 text-primary mb-4" />
                  <h3 className="font-display text-lg text-silver-bright mb-2 group-hover:text-primary transition-colors">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  <span className="mt-4 inline-flex items-center text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Learn more <ArrowRight className="ml-1 size-3" />
                  </span>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-card/30 border-y border-border py-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-xs tracking-[0.3em] text-primary uppercase">The fleet</p>
              <h2 className="mt-3 font-display text-4xl md:text-5xl text-silver-bright">Vehicles, curated</h2>
            </div>
            <Link to="/fleet">
              <Button variant="outline" className="border-primary/40 text-silver-bright hover:bg-primary/10">
                See all <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {featured.map((v, i) => (
              <motion.div key={v.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.1 }}>
                <Link to={`/booking?vehicle=${v.id}`} className="group block rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all">
                  <div className="aspect-[4/3] overflow-hidden">
                    <VehicleImage imagePath={v.image_url} category={v.category} alt={v.name} className="size-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                  <div className="p-6">
                    <p className="text-xs tracking-[0.2em] text-primary uppercase">{v.category}</p>
                    <h3 className="mt-1 font-display text-2xl text-silver-bright">{v.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{v.description}</p>
                    <p className="mt-4 text-sm text-primary">${Number(v.per_km_rate).toFixed(2)} / mile · ${Number(v.hourly_rate || 90).toFixed(0)} / hour</p>
                  </div>
                </Link>
              </motion.div>
            ))}
            {featured.length === 0 && (
              <p className="text-muted-foreground">Fleet coming soon.</p>
            )}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-8 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs tracking-[0.3em] text-primary uppercase">Why Ride Chic</p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl text-silver-bright">Built on quiet <span className="italic">precision</span></h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">Every Ride Chic ride is choreographed: the right car, the right driver, on time, every time. We invest in the small things — bottled water, immaculate interiors, drivers who know when to talk and when not to.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { Icon: ShieldCheck, t: "Professional chauffeurs", d: "Licensed, vetted, discreet." },
              { Icon: Clock, t: "Always on time", d: "Flight-tracked, traffic-aware." },
              { Icon: Star, t: "Premium fleet", d: "Late-model luxury, always." },
              { Icon: Calendar, t: "Available 24/7", d: "Book any hour, any day." },
            ].map(({ Icon, t, d }) => (
              <Card key={t} className="p-6 bg-card/60">
                <Icon className="size-6 text-primary mb-3" />
                <h4 className="font-display text-lg text-silver-bright">{t}</h4>
                <p className="text-sm text-muted-foreground mt-1">{d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-card/30 border-y border-border py-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs tracking-[0.3em] text-primary uppercase">Clients</p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl text-silver-bright">A trusted ride</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { q: "On time to the minute, S-Class spotless, driver impeccable. The bar has been set.", n: "Élise R.", r: "Corporate client" },
              { q: "Booked the stretch for our wedding. Felt like a film. The team handled every detail.", n: "Marc & Léa", r: "Wedding 2025" },
              { q: "I fly weekly. South Shore Limo Boston is the only service I trust for early-morning Logan runs.", n: "Daniel K.", r: "Frequent flyer" },
            ].map((t) => (
              <Card key={t.n} className="p-8 bg-card/60">
                <div className="flex gap-1 text-primary mb-4">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="size-4 fill-primary" />)}
                </div>
                <p className="italic text-silver leading-relaxed">"{t.q}"</p>
                <div className="mt-6">
                  <p className="text-silver-bright font-medium">{t.n}</p>
                  <p className="text-xs text-muted-foreground">{t.r}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-8 py-24">
        <div className="rounded-3xl p-12 md:p-20 text-center bg-card border border-primary/30 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ background: "var(--gradient-primary)" }} />
          <div className="relative">
            <h2 className="font-display text-4xl md:text-6xl text-silver-bright">Ready when <span className="italic text-primary">you</span> are</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Book your next ride in three steps. Confirmation within minutes.</p>
            <Link to="/booking">
              <Button size="lg" className="mt-8 bg-primary hover:bg-primary/90 tracking-wider px-8">
                Reserve now <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
