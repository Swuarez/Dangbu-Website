import { ArrowLeft } from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";
import { site } from "@/data/site";

const LAST_UPDATED = "23 September 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-lg uppercase tracking-[0.06em] text-bone">{title}</h2>
      <div className="copy-sm flex flex-col gap-2">{children}</div>
    </section>
  );
}

/** Public terms of service for the website + reservation system. */
export default function TermsPage() {
  React.useEffect(() => {
    document.title = "Terms of Service — Dangbu Unlimited Samgyupsal & Buffet";
  }, []);

  return (
    <div className="shell flex flex-col gap-8 pb-16 pt-24 sm:pt-28 lg:pt-32">
      <Link
        to="/"
        className="inline-flex w-fit items-center gap-2 font-sans text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-brass transition-colors hover:text-brass-light"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back to Dangbu
      </Link>

      <header className="flex flex-col gap-3">
        <p className="eyebrow">Legal</p>
        <h1 className="display-lg text-bone">
          Terms of <span className="foil-text">service</span>
        </h1>
        <p className="copy-sm">Last updated: {LAST_UPDATED}</p>
        <p className="copy max-w-[64ch]">
          These terms govern the use of the {site.name} website and online reservation system. By
          booking a table online you agree to them.
        </p>
      </header>

      <div className="panel flex max-w-3xl flex-col gap-7 p-6 sm:p-8">
        <Section title="1. Reservations">
          <ul className="list-disc space-y-1 pl-5">
            <li>An online booking is a reservation <em>request</em>. Our team confirms every booking by SMS or call.</li>
            <li>Tables are held for 15 minutes past the reserved time, after which the booking may be released.</li>
            <li>You can cancel an upcoming booking yourself from the reservation status page using your reference number, or by calling us.</li>
            <li>Online bookings are limited to {`1–20`} guests; larger groups should call ahead.</li>
          </ul>
        </Section>

        <Section title="2. Pricing and payment">
          <ul className="list-disc space-y-1 pl-5">
            <li>All prices shown on this site are per-head estimates in Philippine pesos and may change without prior notice.</li>
            <li>
              No payment is taken online. We never ask for card numbers or banking details on this
              website — all bills are settled in person at the restaurant.
            </li>
            <li>Any total shown during booking is an estimate only; the final bill is computed on site.</li>
          </ul>
        </Section>

        <Section title="3. Acceptable use">
          <p>You agree not to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Submit false, misleading, or fraudulent reservations</li>
            <li>Attempt to access another guest's booking without their reference number</li>
            <li>Interfere with the website, its staff dashboard, or underlying systems</li>
            <li>Use automated tools to bulk-create bookings</li>
          </ul>
          <p>We may cancel bookings that violate these terms.</p>
        </Section>

        <Section title="4. Availability and liability">
          <p>
            We work to keep the website and booking system available and accurate, but we do not
            guarantee uninterrupted service. To the extent permitted by law, {site.name} is not
            liable for indirect losses arising from the use of this website. Nothing in these
            terms limits your statutory consumer rights.
          </p>
        </Section>

        <Section title="5. Privacy">
          <p>
            Personal data collected through reservations is handled as described in our{" "}
            <Link to="/privacy" className="text-brass underline-offset-4 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </Section>

        <Section title="6. Changes and governing law">
          <p>
            We may update these terms from time to time; the date above shows the latest version.
            These terms are governed by the laws of the Republic of the Philippines.
          </p>
          <p>
            Questions? Call us at{" "}
            <a href={site.phones[0].href} className="text-brass underline-offset-4 hover:underline">
              {site.phones[0].label}
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  );
}
