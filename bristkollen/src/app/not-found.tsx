import Link from "next/link";
import { knappPrimar, Pil } from "@/components/knappar";
import { SidHero } from "@/components/SidHero";

export default function SidanFinnsInte() {
  return (
    <SidHero rubrik="Sidan finns inte" underrubrik={<p>Länken kan vara fel, eller så har sidan flyttats.</p>} band={null}>
      <Link href="/" className={knappPrimar}>
        Till startsidan
        <Pil />
      </Link>
    </SidHero>
  );
}
