import { ImageResponse } from "next/og";
import { brand } from "@/config/brand";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Favicon i varumärkets färger: ett hus med en termometer. */
export default function Icon() {
  const { papper, primar, glod } = brand.farger;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: papper,
          borderRadius: 14,
        }}
      >
        <svg width="54" height="54" viewBox="0 0 32 32">
          <path d="M4 15 16 5l12 10" fill="none" stroke={primar} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.5 13.5V27h17V13.5" fill="none" stroke={primar} strokeWidth="3" strokeLinejoin="round" />
          <rect x="14.5" y="12" width="3" height="10" rx="1.5" fill={glod} />
          <circle cx="16" cy="22.6" r="2.8" fill={glod} />
        </svg>
      </div>
    ),
    size,
  );
}
