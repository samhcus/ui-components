/**
 * Wok Specialists mark, ported from the wokspec repo (components/wok-logo.tsx).
 * Renders in currentColor so it takes the brand accent wherever it sits.
 */
export function WokLogo({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <ellipse cx="16" cy="20" rx="12" ry="6" fill="currentColor" opacity="0.15" />
      <path
        d="M4 18 Q4 26 16 26 Q28 26 28 18"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M4 18 L1 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M28 18 L31 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M11 15 Q10 11 12 9 Q13 7 11 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      <path
        d="M16 14 Q15 10 17 8 Q18 6 16 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
      <path
        d="M21 15 Q20 11 22 9 Q23 7 21 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
    </svg>
  );
}
