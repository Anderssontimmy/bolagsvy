import { defineConfig } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    // På Windows hänger Playwrights egna Chromium-binärer när flera körs samtidigt
    // (felsökt 2026-11-25). Edge finns förinstallerat och fungerar. Andra system: Chromium.
    channel: process.platform === "win32" ? "msedge" : undefined,
  },
  projects: [
    { name: "mobil-360", use: { viewport: { width: 360, height: 760 } } },
    { name: "dator", use: { viewport: { width: 1280, height: 800 } } },
  ],
  // Kör mot produktionsbygget: `npm run build` först.
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
