import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useSeo } from "@/lib/useSeo";

export default function About() {
  useSeo({
    title: "About — South Shore Limo Boston",
    description: "The story behind South Shore Limo Boston: quiet precision, premium chauffeurs, and a curated luxury fleet serving Boston and the South Shore.",
  });
  return (
    <>
      <Header />
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl">
          <p className="text-xs tracking-[0.3em] text-primary uppercase">About South Shore Limo Boston</p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl text-silver-bright">
            A different kind of <span className="italic">arrival</span>
          </h1>
          <div className="mt-10 space-y-6 text-muted-foreground leading-relaxed text-lg">
            <p>South Shore Limo Boston was built on a simple belief: how you arrive matters. Whether it is the boardroom, the chapel, or Logan terminal, the right ride sets the tone.</p>
            <p>Our fleet is curated, not assembled. Every vehicle is late-model, immaculately maintained, and chosen for the experience it offers passengers. Our chauffeurs are licensed professionals — vetted, trained, and discreet.</p>
            <p>We obsess over the small details: chilled water, climate set before you arrive, a route chosen for comfort over haste. Every South Shore Limo Boston ride is a quiet act of precision.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
