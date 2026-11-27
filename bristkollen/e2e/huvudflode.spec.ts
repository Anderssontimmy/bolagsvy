import { expect, test, type Locator } from "@playwright/test";

/** Datum för N dagar sedan i webbläsarens tidszon, ÅÅÅÅ-MM-DD. */
function dagarSedan(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const tva = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${tva(d.getMonth() + 1)}-${tva(d.getDate())}`;
}

async function fyllKyla(kalk: Locator) {
  await kalk.getByLabel("Kallt i lägenheten").check();
  await kalk.getByLabel("Vilken temperatur har du mätt upp inomhus?").fill("16");
  await kalk.getByLabel("Hur hög är din månadshyra?").fill("9 000");
  return kalk;
}

test("startsidan är på svenska och har rubrik, kalkylator och väntelista", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "sv");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kallt hemma eller trasigt i lägenheten?");
  await expect(page.getByRole("heading", { name: "Så funkar det" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Räkna ut" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Snart kan du anmäla bristen/ })).toBeVisible();
});

test("kalkylatorn visar ett spann för en anmäld kall lägenhet", async ({ page }) => {
  await page.goto("/");
  const kalk = await fyllKyla(page.locator("#kalkylator"));
  await kalk.getByLabel("Ja", { exact: true }).first().check();
  await kalk.getByLabel("Vilket datum fick hyresvärden din anmälan?").fill(dagarSedan(30));
  await kalk.getByLabel("Nej, inte än").check();
  await kalk.getByRole("button", { name: "Räkna ut" }).click();

  const resultat = kalk.getByRole("heading", { name: "Din uppskattning" });
  await expect(resultat).toBeFocused();
  // 9 000 kr × 5–25 % × 30 dagar ÷ 30
  await expect(kalk.getByText(/^450–2\s250 kr$/)).toBeVisible();
  await expect(kalk.getByText("Uppskattning – ingen garanti")).toBeVisible();
});

test("kalkylatorn varnar när bristen inte är anmäld skriftligt", async ({ page }) => {
  await page.goto("/kalkylator");
  const kalk = await fyllKyla(page.getByRole("main"));
  await kalk.getByLabel("Nej, inte skriftligt").check();
  await kalk.getByRole("button", { name: "Räkna ut" }).click();

  await expect(kalk.getByRole("heading", { name: /inte räkna med någon nedsättning/ })).toBeFocused();
  await expect(kalk.getByText(/Varje dag utan skriftlig anmälan kan kosta dig ungefär 15–75 kr/)).toBeVisible();
  await expect(kalk.getByRole("link", { name: "Så anmäler du en brist" })).toBeVisible();
});

test("kalkylatorn visar fel när uppgifter saknas", async ({ page }) => {
  await page.goto("/kalkylator");
  await page.getByRole("button", { name: "Räkna ut" }).click();
  await expect(page.getByRole("heading", { name: "Kontrollera uppgifterna" })).toBeFocused();
  await expect(page.getByRole("link", { name: "Välj vilken typ av brist du har." })).toBeVisible();
});

test("man kan skriva upp sig på väntelistan", async ({ page }) => {
  await page.goto("/");
  const lista = page.locator("#vantelista");
  await lista.getByLabel("Din e-postadress").fill(`test+${Date.now()}@exempel.se`);
  await lista.getByLabel("Vilken brist har du? (frivilligt)").selectOption("kyla");
  await lista.getByLabel(/Jag godkänner/).check();
  await lista.getByRole("button", { name: "Skriv upp mig" }).click();
  await expect(lista.getByRole("heading", { name: "Tack! Du står nu på väntelistan." })).toBeVisible();
});

test("artiklar har ansvarsruta, granskningsdatum och källor", async ({ page }) => {
  await page.goto("/artiklar/far-jag-halla-inne-hyran");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Får jag hålla inne hyran?");
  await expect(page.getByText("Detta är allmän information, inte juridisk rådgivning.")).toBeVisible();
  await expect(page.getByText(/Senast granskad:/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Källor" })).toBeVisible();
});

test("anmälan till hyresvärden är avstängd när e-post inte är inställd", async ({ page }) => {
  await page.goto("/anmal");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Anmäl bristen till hyresvärden");
  await expect(page.getByText(/Snart kan du skicka en skriftlig anmälan/)).toBeVisible();
  await expect(page.getByLabel("Ditt namn")).toHaveCount(0);
});

test("ingen sida scrollar i sidled", async ({ page }) => {
  for (const sida of ["/", "/kalkylator", "/anmal", "/artiklar", "/artiklar/sa-anmaler-du-en-brist", "/integritet", "/om"]) {
    await page.goto(sida);
    const bredd = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(bredd, sida).toBeLessThanOrEqual(0);
  }
});
