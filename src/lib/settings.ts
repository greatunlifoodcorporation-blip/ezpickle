import "server-only";
import { prisma } from "./prisma";

export type BusinessSettings = {
  businessName: string;
  logoUrl: string;
  logoShowName: boolean; // show the business name next to an uploaded logo
  email: string;
  phone: string;
  address: string;
  timezone: string;
  currency: string;
  openingMin: number; // minutes from midnight, Asia/Manila
  closingMin: number;
  bookingIntervalMins: number;
  minBookingMins: number;
  maxBookingMins: number;
  maxAdvanceDays: number;
  minCancelNoticeMins: number;
  holdMinutes: number; // payment deadline for a court hold
  bufferMins: number; // gap enforced between bookings on a court
  openPlayHoldMinutes: number;
  waitlistOfferMinutes: number;
  cancellationPolicy: string;
  // Landing page text, editable from Admin → Settings
  heroLine1: string;
  heroLine2: string;
  heroAccent: string;
  heroSubtitle: string;
  facilityTitle: string;
  facilityDescription: string;
  courtsTitle: string;
  courtsDescription: string;
};

export const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: "EzPickle",
  logoUrl: "/logo.png",
  logoShowName: true,
  email: "hello@ezpickle.ph",
  phone: "+63 917 000 0000",
  address: "Quezon City, Metro Manila, Philippines",
  timezone: "Asia/Manila",
  currency: "PHP",
  openingMin: 6 * 60,
  closingMin: 23 * 60,
  bookingIntervalMins: 30,
  minBookingMins: 60,
  maxBookingMins: 180,
  maxAdvanceDays: 30,
  minCancelNoticeMins: 240,
  holdMinutes: 15,
  bufferMins: 0,
  openPlayHoldMinutes: 15,
  waitlistOfferMinutes: 30,
  cancellationPolicy:
    "Bookings may be cancelled for a full refund up to 4 hours before start time. Later cancellations are non-refundable.",
  heroLine1: "Play Easy.",
  heroLine2: "Play More.",
  heroAccent: "Play EzPickle.",
  heroSubtitle:
    "Live court availability, Open Play nights that sort themselves out. Reserve in under a minute and pay with GCash, Maya or card.",
  facilityTitle: "Built for the game",
  facilityDescription:
    "Cushioned indoor courts, proper lighting, and somewhere decent to sit between games.",
  courtsTitle: "Pick your court",
  courtsDescription: "Every court is bookable in 30-minute blocks with live availability.",
};

const KEY = "business";

export async function getSettings(): Promise<BusinessSettings> {
  const row = await prisma.setting.findUnique({ where: { key: KEY } });
  if (!row) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...(row.value as Partial<BusinessSettings>) };
}

/**
 * Branding for the whole site (name + logo). Never throws: if the database is
 * unreachable (for example during a build) the default branding is used.
 */
export async function getBrand(): Promise<Pick<BusinessSettings, "businessName" | "logoUrl" | "logoShowName">> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return pickBrand(DEFAULT_SETTINGS);
  }
  try {
    return pickBrand(await getSettings());
  } catch {
    return pickBrand(DEFAULT_SETTINGS);
  }
}

function pickBrand(s: BusinessSettings) {
  return { businessName: s.businessName, logoUrl: s.logoUrl, logoShowName: s.logoShowName };
}

export async function updateSettings(patch: Partial<BusinessSettings>): Promise<BusinessSettings> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await prisma.setting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: next as never },
    update: { value: next as never },
  });
  return next;
}
