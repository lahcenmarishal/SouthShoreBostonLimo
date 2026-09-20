import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";

export function Footer() {
  const { data: s } = useQuery({ queryKey: ["site-settings"], queryFn: getSiteSettings });
  const phone = s?.contact_phone ?? "+1 (774) 434-5351";
  const email = s?.contact_email ?? "contact@southshorebostonlimo.com";
  const socials = [
    { href: s?.facebook_url, Icon: Facebook },
    { href: s?.twitter_url, Icon: Twitter },
    { href: s?.linkedin_url, Icon: Linkedin },
    { href: s?.instagram_url, Icon: Instagram },
  ].filter((x) => !!x.href) as { href: string; Icon: typeof Facebook }[];
  return (
    <footer className="bg-card/40 border-t border-border mt-24">
      <div className="container mx-auto px-4 md:px-8 py-16 grid gap-12 md:grid-cols-4">
        <div>
          <Link to="/" className="font-display text-xl text-silver-bright leading-tight">
            SOUTH SHORE <span className="text-primary italic">Limo</span> BOSTON
          </Link>
          <p className="mt-2 text-xs uppercase tracking-wider text-primary">by Oma Trans INC</p>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            South Shore Limo Boston — a service by Oma Trans INC. Premium chauffeur and limousine service for executives, weddings,
            Logan airport transfers, and special occasions across Boston and the South Shore.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-silver-bright mb-4">Explore</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="text-muted-foreground hover:text-silver-bright">About us</Link></li>
            <li><Link to="/services" className="text-muted-foreground hover:text-silver-bright">Services</Link></li>
            <li><Link to="/fleet" className="text-muted-foreground hover:text-silver-bright">Our fleet</Link></li>
            <li><Link to="/contact" className="text-muted-foreground hover:text-silver-bright">Contact</Link></li>
            <li><Link to="/track" className="text-muted-foreground hover:text-silver-bright">Track my booking</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-silver-bright mb-4">Contact</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Phone className="size-4 text-primary" /><a href={`tel:${phone.replace(/\s+/g, "")}`}>{phone}</a></li>
            <li className="flex items-center gap-2"><Mail className="size-4 text-primary" /><a href={`mailto:${email}`}>{email}</a></li>
          </ul>
        </div>

        {socials.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-silver-bright mb-4">Follow</h4>
            <div className="flex gap-3">
              {socials.map(({ href, Icon }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="size-10 grid place-items-center rounded-full border border-border text-silver hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-border">
        <div className="container mx-auto px-4 md:px-8 py-6 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Oma Trans INC — South Shore Limo Boston. All rights reserved.</span>
          <span>Arrive with distinction.</span>
        </div>
      </div>
    </footer>
  );
}
