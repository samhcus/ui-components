/**
 * A side-profile cat body (not a face): head with two ears, a rounded body, four
 * legs, and an upright curling tail. Fills with currentColor. Used static as the
 * toolbar's cat icon and animated (legs + tail) inside the CatCursor.
 */
export function CatMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 24" fill="currentColor" className={className}>
      {/* tail — sweeps up from the back */}
      <path
        className="cat-tail"
        d="M6.5 15 Q1.5 13.5 3 6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* back legs */}
      <rect className="leg-b" x="7.4" y="15.5" width="2.2" height="7" rx="1.1" />
      <rect className="leg-a" x="10.3" y="15.5" width="2.2" height="7" rx="1.1" />
      {/* front legs */}
      <rect className="leg-a" x="18.1" y="15.5" width="2.2" height="7" rx="1.1" />
      <rect className="leg-b" x="21" y="15.5" width="2.2" height="7" rx="1.1" />
      {/* body + head (bobs while running) */}
      <g className="cat-body">
        <path d="M6 14.5 C6 10.5 8.6 8.5 12.5 8.5 L18 8.5 C20.8 8.5 22.4 10 22.4 12.6 L22.4 15.6 C22.4 17.4 21 18.2 18.8 18.2 L9.4 18.2 C7.2 18.2 6 16.8 6 14.5 Z" />
        <circle cx="23" cy="9" r="4.7" />
        {/* ears */}
        <path d="M19.2 6.2 L20.1 1.7 L22.5 5.2 Z" />
        <path d="M23.7 5.2 L26.1 1.7 L27 6.2 Z" />
        {/* eye notch (background-coloured) */}
        <circle cx="24.6" cy="8.6" r="0.95" fill="var(--background)" />
      </g>
    </svg>
  );
}
