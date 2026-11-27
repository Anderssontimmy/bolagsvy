/**
 * Den enda filen som pratar med Anthropic. Strukturerat svar via zod, låg effort,
 * server-side fallback om modellen vägrar. Kostnad: under 1 kr per ärende.
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { Anropare } from "./index";
import { KATEGORIER } from "./typer";

const MODELL = "claude-opus-5-5";
const BESKRIVNING = z.object({ text: z.string() });
const TOLKNING = z.object({ sammanfattning: z.string(), kategori: z.enum(KATEGORIER), fraga: z.string() });

export function anthropicAnropare(apiKey: string): Anropare {
  const klient = new Anthropic({ apiKey, timeout: 30_000, maxRetries: 1 });
  return async (uppgift, system, text) => {
    const gemensamt = {
      model: MODELL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default" as const,
      system,
      messages: [{ role: "user" as const, content: text }],
    };
    const svar =
      uppgift === "beskrivning"
        ? await klient.beta.messages.parse({ ...gemensamt, output_config: { effort: "low", format: zodOutputFormat(BESKRIVNING) } })
        : await klient.beta.messages.parse({ ...gemensamt, output_config: { effort: "low", format: zodOutputFormat(TOLKNING) } });
    if (svar.stop_reason === "refusal") return null;
    return svar.parsed_output ?? null;
  };
}
