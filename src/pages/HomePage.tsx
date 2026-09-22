import { BranchSection } from "@/components/BranchSection";
import { ContactCTA } from "@/components/ContactCTA";
import { ExperienceSection } from "@/components/ExperienceSection";
import { Hero } from "@/components/Hero";
import { MenuSection } from "@/components/MenuSection";
import { OccasionsSection } from "@/components/OccasionsSection";
import { ReservationSection } from "@/components/ReservationSection";

/** The single-page brand site: hero → experience → menu → occasions → booking → branches → contact. */
export default function HomePage() {
  return (
    <>
      <Hero />
      <ExperienceSection />
      <MenuSection />
      <OccasionsSection />
      <ReservationSection />
      <BranchSection />
      <ContactCTA />
    </>
  );
}
