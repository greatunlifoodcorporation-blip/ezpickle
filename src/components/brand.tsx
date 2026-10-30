"use client";
import { createContext, useContext } from "react";

export type Brand = { businessName: string; logoUrl: string; logoShowName: boolean };

const DEFAULT_BRAND: Brand = { businessName: "EzPickle", logoUrl: "/logo.png", logoShowName: true };

const BrandContext = createContext<Brand>(DEFAULT_BRAND);

export function BrandProvider({ brand, children }: { brand: Brand; children: React.ReactNode }) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand(): Brand {
  return useContext(BrandContext);
}
