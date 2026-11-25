import type { Metadata } from "next";
import { Textsida } from "@/components/Textsida";
import Innehall from "@/content/sidor/integritet.mdx";

export const metadata: Metadata = {
  title: "Integritetspolicy",
  description: "Så hanterar vi dina personuppgifter. Vi samlar in så lite som möjligt och använder inga kakor.",
  alternates: { canonical: "/integritet" },
};

export default function Integritet() {
  return (
    <Textsida titel="Integritetspolicy" utkast uppdaterad="2026-11-25">
      <Innehall />
    </Textsida>
  );
}
