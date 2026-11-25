import type { Metadata } from "next";
import { Textsida } from "@/components/Textsida";
import { brand } from "@/config/brand";
import Innehall from "@/content/sidor/om.mdx";

export const metadata: Metadata = {
  title: `Om ${brand.namn}`,
  description: `Varför ${brand.namn} finns, vad du kan göra här och vad vi inte är.`,
  alternates: { canonical: "/om" },
};

export default function Om() {
  return (
    <Textsida titel={`Om ${brand.namn}`} ingress={brand.slogan}>
      <Innehall />
    </Textsida>
  );
}
