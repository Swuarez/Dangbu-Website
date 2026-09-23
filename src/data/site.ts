/**
 * Static brand + contact information, shared by the navbar, footer,
 * contact CTA and JSON-LD-free UI copy (single source of truth).
 */

export interface PhoneContact {
  label: string;
  href: string;
  type: "mobile" | "landline";
}

export interface SiteInfo {
  name: string;
  fullName: string;
  hangul: string;
  tagline: string;
  description: string;
  hookline: string;
  hours: string;
  city: string;
  phones: PhoneContact[];
  priceRange: string;
  copyright: string;
}

export const site: SiteInfo = {
  name: "DANGBU",
  fullName: "Dangbu Unlimited Samgyupsal & Buffet",
  hangul: "당부 무제한 삼겹살",
  tagline: "Come hungry. Leave satisfied.",
  description:
    "Craving unlimited samgyupsal, premium meats, enoki, side dishes, sauces, rice, desserts & more? Come hungry and enjoy the ultimate ALL-UNLIMITED Korean BBQ experience!",
  hookline:
    "Craving unlimited samgyupsal, premium meats, enoki, side dishes, sauces, rice, desserts & more?",
  hours: "Open daily · 11:00 AM – 10:00 PM",
  city: "Quezon City",
  phones: [
    { label: "0945 673 2698", href: "tel:+639456732698", type: "mobile" },
    { label: "(02) 7001 0685", href: "tel:+63270010685", type: "landline" },
  ],
  priceRange: "₱299 – ₱499",
  copyright: "© 2026 Dangbu Unlimited Samgyupsal & Buffet. All Rights Reserved.",
};

export interface NavLink {
  label: string;
  to: string;
  sectionId: string;
}

/** Primary navigation — order is mirrored in the mobile drawer and footer. */
export const navLinks: NavLink[] = [
  { label: "Home", to: "/#home", sectionId: "home" },
  { label: "Menu", to: "/#menu", sectionId: "menu" },
  { label: "Experience", to: "/#experience", sectionId: "experience" },
  { label: "Reservation", to: "/#reservation", sectionId: "reservation" },
  { label: "Branches", to: "/#branches", sectionId: "branches" },
  { label: "Contact", to: "/#contact", sectionId: "contact" },
];

/** Sections observed by the navbar for active-link indication (document order). */
export const sectionIds = [
  "home",
  "menu",
  "experience",
  "reservation",
  "branches",
  "contact",
];
