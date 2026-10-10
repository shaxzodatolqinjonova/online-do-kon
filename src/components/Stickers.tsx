// Namuna fayldagi panja izi va yurakcha shakllari
export function SvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <g id="pawShape">
          <ellipse cx="50" cy="66" rx="22" ry="18" />
          <ellipse cx="22" cy="42" rx="9" ry="12" transform="rotate(-22 22 42)" />
          <ellipse cx="39" cy="25" rx="9" ry="12" transform="rotate(-6 39 25)" />
          <ellipse cx="61" cy="25" rx="9" ry="12" transform="rotate(6 61 25)" />
          <ellipse cx="78" cy="42" rx="9" ry="12" transform="rotate(22 78 42)" />
        </g>
        <path id="heartShape" d="M50 88C22 68 8 52 8 34 8 19 19 10 31 10c9 0 15 5 19 12 4-7 10-12 19-12 12 0 23 9 23 24 0 18-14 34-42 54Z" />
      </defs>
    </svg>
  );
}

export function PawSticker() {
  return (
    <svg className="sticker paw" viewBox="-8 -8 116 116" aria-hidden="true">
      <use href="#pawShape" fill="#fff" stroke="#fff" strokeWidth="16" strokeLinejoin="round" />
      <use href="#pawShape" fill="#ef93ae" />
    </svg>
  );
}

export function HeartSticker() {
  return (
    <svg className="sticker heart" viewBox="-8 -8 116 116" aria-hidden="true">
      <use href="#heartShape" fill="#fff" stroke="#fff" strokeWidth="16" strokeLinejoin="round" />
      <use href="#heartShape" fill="#f5a3bb" />
      <ellipse cx="30" cy="30" rx="9" ry="6" fill="#fff" opacity=".75" transform="rotate(-30 30 30)" />
    </svg>
  );
}

export function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 20.5C6 16.4 3 13.1 3 9.3 3 6.4 5.2 4.5 7.6 4.5c1.9 0 3.3 1 4.4 2.6 1.1-1.6 2.5-2.6 4.4-2.6 2.4 0 4.6 1.9 4.6 4.8 0 3.8-3 7.1-9 11.2Z" />
    </svg>
  );
}
