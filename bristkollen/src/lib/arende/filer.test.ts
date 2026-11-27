import { expect, it } from "vitest";
import { minnesFiler, supabaseFiler } from "./filer";

it("minnesFiler sparar, ger datalänk och raderar", async () => {
  const f = minnesFiler(new Map());
  await f.spara("a/foto-1.jpg", Buffer.from("abc"), "image/jpeg");
  expect(await f.hamta("a/foto-1.jpg")).toEqual(Buffer.from("abc"));
  expect(await f.lank("a/foto-1.jpg")).toBe("data:image/jpeg;base64,YWJj");
  await f.radera(["a/foto-1.jpg"]);
  await expect(f.hamta("a/foto-1.jpg")).rejects.toThrow();
});

it("supabaseFiler laddar upp och skapar signerade länkar", async () => {
  const anrop: string[] = [];
  const fetchFn = (async (url: string, init: RequestInit) => {
    anrop.push(`${init.method ?? "GET"} ${url}`);
    return new Response(JSON.stringify({ signedURL: "/object/sign/bilagor/a/foto-1.jpg?token=t" }), { status: 200 });
  }) as unknown as typeof fetch;
  const f = supabaseFiler("https://p.supabase.co", "k", "bilagor", fetchFn);
  await f.spara("a/foto-1.jpg", Buffer.from("x"), "image/jpeg");
  expect(await f.lank("a/foto-1.jpg")).toBe("https://p.supabase.co/storage/v1/object/sign/bilagor/a/foto-1.jpg?token=t");
  expect(anrop).toEqual([
    "POST https://p.supabase.co/storage/v1/object/bilagor/a/foto-1.jpg",
    "POST https://p.supabase.co/storage/v1/object/sign/bilagor/a/foto-1.jpg",
  ]);
});
