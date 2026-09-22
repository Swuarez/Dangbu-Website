/**
 * Branch directory. Every branch-powered UI (branch cards, reservation
 * dropdown, directions links) reads from this single list.
 */

export interface Branch {
  id: string;
  name: string;
  shortName: string;
  address: string;
  city: string;
  landmark: string;
  hours: string;
  seating: string;
  mapQuery: string;
}

export const branches: Branch[] = [
  {
    id: "main",
    name: "Main Branch",
    shortName: "Main",
    address: "Omega Street, West Fairview, Quezon City",
    city: "Quezon City",
    landmark: "Along Omega Street, West Fairview — look for the smoking grills.",
    hours: "Open daily · 11:00 AM – 10:00 PM",
    seating: "Grill tables, family tables & celebration area",
    mapQuery: "Dangbu Unlimited Samgyupsal & Buffet, Omega Street, West Fairview, Quezon City",
  },
  {
    id: "novaliches",
    name: "Novaliches Branch",
    shortName: "Novaliches",
    address: "Lot 4, Blk 3 Buenamar St., Novaliches Proper, Quezon City",
    city: "Quezon City",
    landmark: "Buenamar Street, Novaliches Proper — minutes from the bayan.",
    hours: "Open daily · 11:00 AM – 10:00 PM",
    seating: "Grill tables, barkada long tables & group area",
    mapQuery:
      "Dangbu Unlimited Samgyupsal & Buffet, Lot 4 Blk 3 Buenamar Street, Novaliches Proper, Quezon City",
  },
];

export const branchIds: string[] = branches.map((branch) => branch.id);

export function isBranchId(value: string | null | undefined): boolean {
  return Boolean(value) && branchIds.includes(String(value));
}

export function getBranch(id: string | null | undefined): Branch | undefined {
  return branches.find((branch) => branch.id === id);
}

export function getBranchName(id: string | null | undefined): string {
  return getBranch(id)?.name ?? "Selected branch";
}

/** Google Maps deep link built through the documented Maps URLs endpoint. */
export function getDirectionsUrl(branch: Branch): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.mapQuery)}`;
}
