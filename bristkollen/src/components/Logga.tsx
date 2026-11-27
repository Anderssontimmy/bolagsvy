/** Ett hus med ett utropstecken. Dekorativt – namnet står alltid bredvid. */
export function Logga({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <path d="M4 15 16 5l12 10" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 13.5V27h17V13.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" />
      <rect x="14.5" y="12.5" width="3" height="8.5" rx="1.5" fill="var(--brand-orange)" />
      <circle cx="16" cy="23.6" r="1.7" fill="var(--brand-orange)" />
    </svg>
  );
}
