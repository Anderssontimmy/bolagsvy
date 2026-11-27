/** Skalar ner ett foto i webbläsaren till högst 2000 px och gör om det till JPEG. Omkodningen tar bort EXIF. */
export async function skalaFoto(fil: File, max = 2000): Promise<Blob> {
  const bild = await createImageBitmap(fil, { imageOrientation: "from-image" });
  const skala = Math.min(1, max / Math.max(bild.width, bild.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bild.width * skala);
  canvas.height = Math.round(bild.height * skala);
  const rityta = canvas.getContext("2d");
  if (!rityta) throw new Error("Kunde inte läsa fotot");
  rityta.drawImage(bild, 0, 0, canvas.width, canvas.height);
  bild.close();
  return new Promise((klar, fel) =>
    canvas.toBlob((blob) => (blob ? klar(blob) : fel(new Error("Kunde inte läsa fotot"))), "image/jpeg", 0.82),
  );
}
