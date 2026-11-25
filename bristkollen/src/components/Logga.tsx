/** Ett hus med en termometer. Dekorativt – namnet står alltid bredvid. */
export function Logga({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <path d="M4 15 16 5l12 10" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 13.5V27h17V13.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" />
      <rect x="14.6" y="12" width="2.8" height="10" rx="1.4" fill="var(--brand-glod)" />
      <circle cx="16" cy="22.6" r="2.6" fill="var(--brand-glod)" />
    </svg>
  );
}
