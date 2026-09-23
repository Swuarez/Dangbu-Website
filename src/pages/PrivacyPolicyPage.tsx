import { ArrowLeft } from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";
import { branches } from "@/data/branches";
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

/** Public privacy policy (Data Privacy Act of 2012, RA 10173). */
export default function PrivacyPolicyPage() {
  React.useEffect(() => {
    document.title = "Privacy Policy — Dangbu Unlimited Samgyupsal & Buffet";
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
          Privacy <span className="foil-text">policy</span>
        </h1>
        <p className="copy-sm">Last updated: {LAST_UPDATED}</p>
        <p className="copy max-w-[64ch]">
          {site.name} respects your privacy. This policy explains what personal data we collect
          when you reserve a table online, why we collect it, and the rights you have under the
          Philippine Data Privacy Act of 2012 (RA 10173).
        </p>
      </header>

      <div className="panel flex max-w-3xl flex-col gap-7 p-6 sm:p-8">
        <Section title="1. What we collect">
          <p>When you book a table online we collect only what the reservation needs:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Full name</li>
            <li>Mobile number (used to confirm your booking by SMS or call)</li>
            <li>Email address (optional)</li>
            <li>Reservation details: branch, date, time, party size, package, special requests</li>
          </ul>
          <p>
            We do <strong className="text-bone">not</strong> collect payment card data — all
            payments happen in person at the restaurant. We do not use analytics or advertising
            trackers.
          </p>
        </Section>

        <Section title="2. How we use it">
          <ul className="list-disc space-y-1 pl-5">
            <li>To hold and confirm your table reservation</li>
            <li>To contact you about changes to your booking</li>
            <li>To manage seating capacity at our branches</li>
          </ul>
          <p>We never sell or rent your personal data to third parties.</p>
        </Section>

        <Section title="3. Where it is stored">
          <p>
            Reservations are stored in our Supabase-hosted database (PostgreSQL, encrypted at
            rest). Access is restricted to authorized Dangbu staff through row-level security
            policies, and staff actions on reservations are recorded in an audit log. The site is
            served over HTTPS via Cloudflare.
          </p>
          <p>
            This website stores strictly necessary data on your own device (browser local
            storage): your staff login session if you are an employee, and your reservation list
            when the site runs in offline preview mode. No tracking cookies are used.
          </p>
        </Section>

        <Section title="4. How long we keep it">
          <p>
            Reservation records are kept for up to 12 months after your visit for bookkeeping and
            dispute purposes, then deleted or anonymized. You may ask us to delete your data
            earlier (see Your rights below).
          </p>
        </Section>

        <Section title="5. Your rights">
          <p>Under RA 10173 you may request to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong className="text-bone">Access</strong> — view your booking any time with the
              reference number we issue (the reservation status page shows everything we hold)
            </li>
            <li>
              <strong className="text-bone">Correct</strong> — call us to fix wrong details
            </li>
            <li>
              <strong className="text-bone">Cancel / delete</strong> — cancel an upcoming booking
              yourself from the reservation status page, or ask us to erase your record entirely
            </li>
            <li>
              <strong className="text-bone">Complain</strong> — raise concerns with us, or with the
              National Privacy Commission (privacy.gov.ph)
            </li>
          </ul>
        </Section>

        <Section title="6. Contact us">
          <p>For any privacy request or question, reach us at:</p>
          <ul className="list-disc space-y-1 pl-5">
            {site.phones.map((phone) => (
              <li key={phone.href}>
                <a href={phone.href} className="text-brass underline-offset-4 hover:underline">
                  {phone.label}
                </a>
              </li>
            ))}
            {branches.map((branch) => (
              <li key={branch.id}>
                {branch.name} — {branch.address}
              </li>
            ))}
          </ul>
          <p>We aim to respond to data requests within 15 days.</p>
        </Section>

        <Section title="7. Changes">
          <p>
            If this policy changes we will update the date above. Material changes will be
            announced on this website.
          </p>
        </Section>
      </div>
    </div>
  );
}
