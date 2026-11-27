import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { behandlaFoto, valideraFoton } from "./foto";

const bild = (w: number, h: number) => sharp({ create: { width: w, height: h, channels: 3, background: "#7a8b99" } });

describe("validera foton", () => {
  it("godtar upp till 5 bilder i rätt format", () => {
    expect(valideraFoton(Array(5).fill({ type: "image/jpeg", size: 100_000 }))).toBeNull();
  });
  it("stoppar för många, fel format och för stora", () => {
    expect(valideraFoton(Array(6).fill({ type: "image/jpeg", size: 1 }))).toMatch(/högst 5/);
    expect(valideraFoton([{ type: "application/pdf", size: 1 }])).toMatch(/JPEG, PNG eller WebP/);
    expect(valideraFoton([{ type: "image/png", size: 5 * 1024 * 1024 }])).toMatch(/för stora/);
  });
});

describe("behandla foto", () => {
  it("tar bort all metadata och gör JPEG", async () => {
    const med = await bild(40, 30).withExif({ IFD0: { Copyright: "Hemligt" } }).jpeg().toBuffer();
    expect((await sharp(med).metadata()).exif).toBeDefined();
    const ut = await behandlaFoto(med);
    const meta = await sharp(ut.data).metadata();
    expect(meta.format).toBe("jpeg");
    expect(meta.exif).toBeUndefined();
    expect(ut.sha256).toMatch(/^[0-9a-f]{64}$/);
  });
  it("skalar ner stora bilder till högst 2000 px", async () => {
    const ut = await behandlaFoto(await bild(3000, 1000).jpeg().toBuffer());
    expect((await sharp(ut.data).metadata()).width).toBe(2000);
  });
  it("kastar fel för något som inte är en bild", async () => {
    await expect(behandlaFoto(Buffer.from("inte en bild"))).rejects.toThrow();
  });
});
