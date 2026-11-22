import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/config/site";
import { notify } from "@/lib/notify";
import { PATHS } from "@/utils/paths";

const SHOP_LINKS = [
  { label: "All medicines", to: PATHS.SHOP },
  { label: "Today's deals", to: PATHS.DEALS },
  { label: "Your cart", to: PATHS.CART },
  { label: "Prescription medicines", to: PATHS.CATEGORIES },
  { label: "Over-the-counter", to: PATHS.CATEGORIES },
  { label: "Vitamins & supplements", to: PATHS.CATEGORIES },
  { label: "Medical devices", to: PATHS.CATEGORIES },
];

const HELP_LINKS = [
  { label: "How to order", target: "health-tips" },
  { label: "Healthcare guides", target: "health-tips" },
  { label: "Delivery & returns", target: "top" },
  { label: "Verify a vendor", target: "categories" },
];

const SOCIALS = [
  { label: "Facebook", short: "f" },
  { label: "Instagram", short: "ig" },
  { label: "LinkedIn", short: "in" },
  { label: "X", short: "x" },
];

function FooterLink({ label, to, target }) {
  return (
    <Link
      to={to ?? { pathname: PATHS.HOME, hash: `#${target}` }}
      className="text-sm text-muted transition hover:text-primary"
    >
      {label}
    </Link>
  );
}

function Footer() {
  const [email, setEmail] = useState("");

  function handleSubscribe(event) {
    event.preventDefault();
    const value = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      notify.error("Enter a valid email address to subscribe.");
      return;
    }

    notify.success("You're on the list. Watch your inbox for health tips.");
    setEmail("");
  }

  return (
    <footer className="mt-16 border-t border-line bg-surface sm:mt-20">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link
              to={PATHS.HOME}
              className="flex items-center gap-2 font-heading text-xl font-bold text-primary"
              aria-label={`${siteConfig.name} home`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-control bg-primary text-primary-foreground">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M10.5 4.5a3 3 0 0 1 4.24 0l4.76 4.76a3 3 0 0 1 0 4.24l-4.76 4.76a3 3 0 0 1-4.24 0L5.74 13.5a3 3 0 0 1 0-4.24L10.5 4.5Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path d="M7.5 16.5 16.5 7.5" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </span>
              {siteConfig.name}
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              {siteConfig.description} Every order is sourced from licensed pharmacies and
              checked before it reaches your door.
            </p>

            <div className="mt-5 space-y-2 text-sm text-muted">
              <p className="flex items-start gap-2.5">
                <MapPin
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                24 Health Avenue, Suite 300, Dhaka 1205
              </p>
              <p className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                +880 1300 555 120
              </p>
              <p className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                care@medico.example
              </p>
            </div>

            <div className="mt-6 flex gap-2">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href="#top"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-xs font-bold text-muted transition hover:border-primary hover:bg-primary hover:text-primary-foreground"
                >
                  {social.short}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-heading text-sm font-bold text-foreground">Shop</h3>
            <ul className="mt-4 space-y-3">
              {SHOP_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterLink {...link} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-sm font-bold text-foreground">Company</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  to={PATHS.ABOUT}
                  className="text-sm text-muted transition hover:text-primary"
                >
                  About Medico
                </Link>
              </li>
              <li>
                <Link
                  to={PATHS.REGISTER}
                  className="text-sm text-muted transition hover:text-primary"
                >
                  Become a vendor
                </Link>
              </li>
              <li>
                <FooterLink label="Pharmacy partners" to={PATHS.CATEGORIES} />
              </li>

              <li>
                <FooterLink label="Careers" to={PATHS.HOME} />
              </li>
            </ul>

            <h3 className="mt-8 font-heading text-sm font-bold text-foreground">
              Support
            </h3>
            <ul className="mt-4 space-y-3">
              {HELP_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterLink {...link} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-sm font-bold text-foreground">
              Care newsletter
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Monthly medicine safety tips and member-only savings. No spam, ever.
            </p>
            <form onSubmit={handleSubscribe} className="mt-4">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <div className="flex gap-2">
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="h-10 min-w-0 flex-1 rounded-control border border-line bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary"
                />
                <Button type="submit" size="icon" aria-label="Subscribe to newsletter">
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </form>
            <div className="mt-6 rounded-card border border-line bg-accent/50 p-4">
              <p className="text-xs font-semibold text-foreground">
                Need help with an order?
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Our pharmacists reply within minutes, every day of the week.
              </p>
              <Link
                to={PATHS.ABOUT}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                Talk to a pharmacist
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved. Medicines
            are dispensed only against a valid prescription where required.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-muted">
            <span className="rounded border border-line px-2 py-1">VISA</span>
            <span className="rounded border border-line px-2 py-1">Mastercard</span>
            <span className="rounded border border-line px-2 py-1">bKash</span>
            <span className="rounded border border-line px-2 py-1">Nagad</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
