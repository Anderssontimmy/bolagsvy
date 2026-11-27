import { expect, test } from "@playwright/test";

test.use({ baseURL: "http://localhost:3101" });

test("hela ärendet i testläge: anmälan, svar, kundens svar och avslut", async ({ page }) => {
  await page.goto("/anmal");
  await page.getByLabel("Ditt namn").fill("Anna Andersson");
  await page.getByLabel("Din e-postadress").fill("anna@exempel.se");
  await page.getByLabel("Gatuadress").fill("Storgatan 12");
  await page.getByLabel("Postnummer").fill("12345");
  await page.getByLabel("Ort").fill("Exempelstad");
  await page.getByLabel("Lägenhetsnummer").fill("1102");
  await page.getByLabel("Hyresvärdens namn").fill("Exempelbostäder AB");
  await page.getByLabel("Hyresvärdens e-postadress för felanmälan").fill("felanmalan@exempelbostader.se");
  await page.getByLabel("Vilken typ av brist?").selectOption("kyla");
  await page.getByLabel("Sedan när finns bristen?").fill("2026-11-01");
  await page.getByLabel("Beskriv bristen").fill("Elementen i vardagsrummet är kalla sedan början av november.");
  await page.getByLabel(/^Foton/).setInputFiles("e2e/fixtures/termometer.jpg");
  await expect(page.getByRole("img", { name: "Foto 1" })).toBeVisible();

  await page.getByRole("button", { name: "Granska anmälan" }).click();
  await expect(page.getByLabel("Beskrivning i anmälan")).toBeEnabled();
  await expect(page.getByLabel("Beskrivning i anmälan")).toHaveValue(/Elementen i vardagsrummet/);
  await expect(page.getByText("1 foto")).toBeVisible();
  await page.getByLabel(/Jag ger Halvhyra\.se i uppdrag/).check();
  await page.getByRole("button", { name: "Skicka bekräftelselänk till min e-post" }).click();

  await page.getByRole("link", { name: "Öppna bekräftelselänken" }).click();
  await expect(page.getByText("Bilagor")).toBeVisible();
  await page.getByRole("button", { name: /Skicka anmälan till Exempelbostäder AB/ }).click();
  await expect(page.getByRole("heading", { name: "Anmälan är skickad" })).toBeVisible();

  await page.getByRole("link", { name: "Följ ditt ärende" }).click();
  await expect(page.getByRole("heading", { name: "Skickad – väntar på svar" })).toBeVisible();
  await expect(page.getByText("Anmälan skickad")).toBeVisible();

  await page.getByRole("button", { name: "Simulera svar från hyresvärden" }).click();
  await expect(page.getByRole("heading", { name: "Hyresvärden har svarat" })).toBeVisible();
  await expect(page.getByText("Hyresvärden svarade")).toBeVisible();

  await page.getByLabel("Ditt svar").fill("Torsdag mellan 8 och 12 går bra.");
  await page.getByRole("button", { name: "Skicka svaret" }).click();
  await expect(page.getByText("Du svarade")).toBeVisible();

  await page.getByRole("button", { name: "Bristen är åtgärdad" }).click();
  await expect(page.getByRole("heading", { name: "Ärendet är avslutat" })).toBeVisible();

  const bredd = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(bredd).toBeLessThanOrEqual(0);
});
