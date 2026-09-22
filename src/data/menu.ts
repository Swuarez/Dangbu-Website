import img1 from "@/assets/img1.jpg";
import img2 from "@/assets/img2.jpg";
import img3 from "@/assets/img3.jpg";
import img4 from "@/assets/img4.jpg";

/**
 * The four official menu posters supplied with the project.
 * Each poster prints its own price, so the poster is wired to the price it
 * actually shows: img4 → ₱299, img3 → ₱399, img2 → ₱459, img1 → ₱499.
 */
export interface MenuGroup {
  title: string;
  items: string[];
}

export interface MenuPackage {
  id: string;
  price: string;
  priceValue: number;
  name: string;
  shortName: string;
  tagline: string;
  blurb: string;
  image: string;
  imageAlt: string;
  featured?: boolean;
  highlights: string[];
  groups: MenuGroup[];
}

const PORK_FLAVORS = "Dangbu · Salt & Pepper · Galbi · Spicy Bulgogi";

const MAIN_DISHES = [
  "Pork Binagoongan",
  "Caldereta",
  "Sisig",
  "Chicken Curry",
  "Stir Fry Pork w/ Vegetables",
  "Chop Suey",
  "Kimchi Enoki Mushroom Soup",
];

const SIDE_DISHES = [
  "Kimchi",
  "Pickled Radish",
  "Fish Cake",
  "Potato Marble",
  "Japchae",
  "Kimbap",
  "Tteokbokki",
  "Cucumber",
  "Lettuce",
];

const RICE = ["Plain Rice", "Garlic Rice", "Kimchi Rice"];
const SAUCES = ["Dangbu Special", "Cheese", "Ssamjang"];
const DESSERTS = ["Buko Pandan", "Coffee Jelly", "Minatamis na Saging"];
const DRINKS = ["Ice Tea", "Blue Lemonade", "Cucumber"];

export const menuPackages: MenuPackage[] = [
  {
    id: "standard",
    price: "₱299",
    priceValue: 299,
    name: "Dangbu Standard Set",
    shortName: "Standard Set",
    tagline: "The everyday unli classic",
    blurb:
      "Unlimited regular and premium pork, main dishes, side dishes, rice, sauces and dessert — the classic Dangbu table.",
    image: img4,
    imageAlt: "Dangbu ₱299 standard set menu poster listing unlimited pork, main dishes and side dishes",
    highlights: [
      "Unlimited regular & premium pork",
      "7 main dishes + 9 side dishes",
      "Rice, sauces & dessert included",
    ],
    groups: [
      {
        title: "Unlimited Pork",
        items: [`Regular Pork — ${PORK_FLAVORS}`, `Premium Pork — ${PORK_FLAVORS}`],
      },
      { title: "Main Dishes", items: MAIN_DISHES },
      { title: "Side Dishes", items: SIDE_DISHES },
      { title: "Rice", items: RICE },
      { title: "Sauces", items: SAUCES },
      { title: "Dessert", items: DESSERTS },
    ],
  },
  {
    id: "favorite",
    price: "₱399",
    priceValue: 399,
    name: "All Time Favorite Package",
    shortName: "All Time Favorite",
    tagline: "Pork, beef & enoki",
    blurb:
      "Everything in the Standard Set plus unlimited beef, unlimited enoki and unlimited drinks.",
    image: img3,
    imageAlt: "Dangbu ₱399 all time favorite menu poster listing unlimited pork, beef and enoki",
    highlights: [
      "Unlimited pork & beef",
      "Unlimited enoki + mixed meats",
      "Unlimited drinks, sides & dessert",
    ],
    groups: [
      { title: "Unlimited Pork", items: [`Pork — ${PORK_FLAVORS}`] },
      { title: "Unlimited Beef", items: [`Beef — ${PORK_FLAVORS}`] },
      { title: "Unlimited Enoki", items: ["Enoki with Pork", "Enoki with Beef"] },
      { title: "Mixed Meats", items: ["Premium Beef + Regular Pork + Premium Pork"] },
      { title: "Main Dishes", items: MAIN_DISHES },
      { title: "Side Dishes", items: SIDE_DISHES },
      { title: "Unlimited Drinks", items: DRINKS },
      { title: "Rice", items: RICE },
      { title: "Unli Sauces", items: SAUCES },
      { title: "Dessert", items: DESSERTS },
    ],
  },
  {
    id: "signature",
    price: "₱459",
    priceValue: 459,
    name: "Signature Feast",
    shortName: "Signature Feast",
    tagline: "Adds unlimited chicken breast fillet",
    blurb:
      "The full pork, beef and enoki spread plus unlimited chicken breast fillet in barbecue special flavor.",
    image: img2,
    imageAlt: "Dangbu ₱459 signature feast menu poster with unlimited pork, beef, enoki and chicken breast fillet",
    highlights: [
      "Unlimited pork, beef & enoki",
      "Unlimited chicken breast fillet",
      "Unlimited drinks, sides & dessert",
    ],
    groups: [
      { title: "Unlimited Pork", items: [`Pork — ${PORK_FLAVORS}`] },
      { title: "Unlimited Beef", items: [`Beef — ${PORK_FLAVORS}`] },
      { title: "Unlimited Enoki", items: ["Enoki with Pork", "Enoki with Beef"] },
      {
        title: "Unlimited Chicken Breast Fillet",
        items: ["Flavor: Barbecue Special"],
      },
      { title: "Mixed Meats", items: ["Premium Beef + Regular Pork + Premium Pork"] },
      { title: "Main Dishes", items: MAIN_DISHES },
      { title: "Side Dishes", items: SIDE_DISHES },
      { title: "Unlimited Drinks", items: DRINKS },
      { title: "Rice", items: RICE },
      { title: "Unli Sauces", items: SAUCES },
      { title: "Dessert", items: DESSERTS },
    ],
  },
  {
    id: "bestseller",
    price: "₱499",
    priceValue: 499,
    name: "Best Seller",
    shortName: "Best Seller",
    tagline: "The complete unlimited spread",
    blurb:
      "Our top table: pork, beef, enoki, chicken breast fillet, unli chicken wings in four flavors, pasta dishes and every unlimited side.",
    image: img1,
    imageAlt:
      "Dangbu ₱499 best seller menu poster with unlimited pork, beef, chicken wings, pasta dishes and desserts",
    featured: true,
    highlights: [
      "Everything in the Signature Feast",
      "Unli chicken wings — 4 flavors",
      "Pasta dishes: Spaghetti & Carbonara",
    ],
    groups: [
      { title: "Unlimited Pork", items: [`Pork — ${PORK_FLAVORS}`] },
      { title: "Unlimited Beef", items: [`Beef — ${PORK_FLAVORS}`] },
      { title: "Unlimited Enoki", items: ["Enoki with Pork", "Enoki with Beef"] },
      { title: "Unlimited Chicken Breast Fillet", items: ["Flavor: Barbecue Special"] },
      {
        title: "Unlimited Chicken Wings",
        items: ["Cheese", "Buffalo", "Honey Glazed", "Teriyaki"],
      },
      { title: "Mixed Meats", items: ["Premium Beef + Regular Pork + Premium Pork"] },
      { title: "Pasta Dishes", items: ["Spaghetti", "Carbonara"] },
      { title: "Main Dishes", items: MAIN_DISHES },
      { title: "Side Dishes", items: SIDE_DISHES },
      { title: "Unlimited Drinks", items: DRINKS },
      { title: "Rice", items: RICE },
      { title: "Unli Sauces", items: SAUCES },
      { title: "Dessert", items: DESSERTS },
    ],
  },
];

/** Value used by the reservation dropdown when the guest has not decided yet. */
export const UNDECIDED_PACKAGE_ID = "undecided";

export interface PackageOption {
  id: string;
  label: string;
  priceValue: number | null;
}

export const packageOptions: PackageOption[] = [
  ...menuPackages.map((pkg) => ({
    id: pkg.id,
    label: `${pkg.price} — ${pkg.name}`,
    priceValue: pkg.priceValue,
  })),
  { id: UNDECIDED_PACKAGE_ID, label: "Not Sure Yet", priceValue: null },
];

export function getPackage(id: string | null | undefined): MenuPackage | undefined {
  return menuPackages.find((pkg) => pkg.id === id);
}

export function getPackageLabel(id: string | null | undefined): string {
  if (!id) return "Package";
  if (id === UNDECIDED_PACKAGE_ID) return "Not Sure Yet";
  const pkg = getPackage(id);
  return pkg ? `${pkg.price} — ${pkg.name}` : "Package";
}

export function getPackagePrice(id: string | null | undefined): number | null {
  if (!id || id === UNDECIDED_PACKAGE_ID) return null;
  return getPackage(id)?.priceValue ?? null;
}

export const featuredPackage = menuPackages.find((pkg) => pkg.featured) ?? menuPackages[0];
