import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";
import { ARTIKLAR } from "@/content/artiklar";

export default function sitemap(): MetadataRoute.Sitemap {
  const sidor = ["/", "/kalkylator", "/artiklar", "/om", "/integritet", "/villkor"];
  return [
    ...sidor.map((s) => ({ url: `${brand.url}${s === "/" ? "" : s}` })),
    ...ARTIKLAR.map((a) => ({ url: `${brand.url}/artiklar/${a.slug}`, lastModified: a.senastGranskad })),
  ];
}
