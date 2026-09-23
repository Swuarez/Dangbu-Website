import { BranchSection } from "@/components/BranchSection";
import { ContactCTA } from "@/components/ContactCTA";
import { ExperienceSection } from "@/components/ExperienceSection";
import { Hero } from "@/components/Hero";
import { MenuSection } from "@/components/MenuSection";
import { ReservationSection } from "@/components/ReservationSection";

/** The single-page brand site: hero (with occasions) → menu → experience → booking → branches → contact. */
export default function HomePage() {
  return (
    <>
      <Hero />
      <MenuSection />
      <ExperienceSection />
      <ReservationSection />
      <BranchSection />
      <ContactCTA />
    </>
  );
}
