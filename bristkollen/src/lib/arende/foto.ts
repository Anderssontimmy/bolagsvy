/** Foton som kunden bifogar. Kodas alltid om på servern, så att ingen dold information (som GPS) följer med. */
import { createHash } from "node:crypto";
import sharp from "sharp";
import { FOTO_MAX_ANTAL, FOTO_MAX_TOTAL, FOTO_TYPER } from "./validering";

export function valideraFoton(filer: { type: string; size: number }[]): string | null {
  if (filer.length > FOTO_MAX_ANTAL) return `Du kan bifoga högst ${FOTO_MAX_ANTAL} foton.`;
  if (filer.some((f) => !FOTO_TYPER.includes(f.type))) return "Foton måste vara JPEG, PNG eller WebP.";
  if (filer.reduce((summa, f) => summa + f.size, 0) > FOTO_MAX_TOTAL) {
    return "Fotona är för stora tillsammans. Ta bort något foto och försök igen.";
  }
  return null;
}

export async function behandlaFoto(data: Buffer): Promise<{ data: Buffer; sha256: string }> {
  const ut = await sharp(data, { failOn: "error" })
    .rotate()
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();
  return { data: ut, sha256: createHash("sha256").update(ut).digest("hex") };
}
