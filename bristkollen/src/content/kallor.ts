/** Källor som artiklarna hänvisar till. Alla länkar kontrollerades 2026-11-25 (HTTP 200). */
export type Kalla = { titel: string; utgivare: string; url: string };

export const KALLOR = {
  hgfHyresreduktion: {
    titel: "Hyresreduktion – har du rätt till hyresreducering?",
    utgivare: "Hyresgästföreningen",
    url: "https://www.hyresgastforeningen.se/stod-och-rad/hyra/hyresreducering/",
  },
  hgfKallt: {
    titel: "Kallt i lägenheten? Det här kan du kräva av din hyresvärd",
    utgivare: "Hyresgästföreningen, pressmeddelande via TT",
    url: "https://via.tt.se/pressmeddelande/4600875/kallt-i-lagenheten-det-har-kan-du-krava-av-din-hyresvard?lang=sv",
  },
  hemHyra: {
    titel: "Så mycket kan din hyra sänkas",
    utgivare: "Hem & Hyra",
    url: "https://www.hemhyra.se/nyheter/sa-mycket-kan-din-hyra-sankas/",
  },
  fastigheterRenovering: {
    titel: "Renovering i hyresrätt – regler och rättigheter",
    utgivare: "fastigheter.se",
    url: "https://fastigheter.se/artiklar/renovering-hyresratt-regler-guide",
  },
  fastighetsagarnaBrister: {
    titel: "Hyresvärdens ansvar vid brister i lägenheten (PDF)",
    utgivare: "Fastighetsägarna",
    url: "https://www.fastighetsagarna.se/globalassets/broschyrer-och-faktablad/riktlinjer/hyresvardens-ansvar-vid-brister-i-lagenheten.pdf",
  },
  jb12: {
    titel: "Jordabalken, 12 kap. Hyra (SFS 1970:994)",
    utgivare: "Lagar.se",
    url: "https://www.lagar.se/lag/sfs-1970-994/kapitel-12/",
  },
  nja2002: {
    titel: "NJA 2002 s. 378",
    utgivare: "lagen.nu",
    url: "https://lagen.nu/dom/nja/2002s378",
  },
  lawlineSedvanligt: {
    titel: "Har hyresgästen rätt till nedsättning av hyra vid sedvanligt underhåll?",
    utgivare: "Lawline",
    url: "https://lawline.se/answers/hyresgastens-ratt-till-nedsattning-av-hyra-vid-sedvanligt-underhall",
  },
  lawlineKallt: {
    titel: "Kallt i lägenheten?",
    utgivare: "Lawline",
    url: "https://lawline.se/answers/kallt-i-lagenheten",
  },
  lawlineForenklat: {
    titel: "Vad är rättegångskostnaderna i förenklade tvistemål?",
    utgivare: "Lawline",
    url: "https://lawline.se/answers/vad-ar-rattegangskostnaderna-i-forenklade-tvistemal",
  },
  lansstyrelsenDeponera: {
    titel: "Deponera hyra",
    utgivare: "Länsstyrelsen",
    url: "https://www.lansstyrelsen.se/nationellt-innehall/samhalle/betalning-ekonomi-och-pengar/deponera-pengar/deponera-hyra.html",
  },
} as const satisfies Record<string, Kalla>;
