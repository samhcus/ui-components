/**
 * The authentic Instagram gradient, defined once for the whole document.
 * Any Instagram glyph fills with `fill: url(#ig-gradient)` on hover (see the
 * `.social-instagram` rules in globals.css). Rendered a single time at the root
 * so the id is unique — nav and the "Meet Samuel" widget both reference it.
 * The light-mode first-stop swap is handled in globals.css.
 */
export function IgGradientDefs() {
  return (
    <svg aria-hidden="true" focusable="false" className="absolute h-0 w-0">
      <defs>
        <linearGradient id="ig-gradient" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#FEDA75" />
          <stop offset="25%" stopColor="#FA7E1E" />
          <stop offset="50%" stopColor="#D62976" />
          <stop offset="75%" stopColor="#962FBF" />
          <stop offset="100%" stopColor="#4F5BD5" />
        </linearGradient>
      </defs>
    </svg>
  );
}
