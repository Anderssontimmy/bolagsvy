import type { Metadata } from "next";
import { Textsida } from "@/components/Textsida";
import Innehall from "@/content/sidor/villkor.mdx";

export const metadata: Metadata = {
  title: "Villkor",
  description: "Villkor för att använda tjänsten.",
  alternates: { canonical: "/villkor" },
};

export default function Villkor() {
  return (
    <Textsida titel="Villkor" utkast uppdaterad="2026-11-25">
      <Innehall />
    </Textsida>
  );
}
