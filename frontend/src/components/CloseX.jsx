/** @jsxImportSource react */

// The cross inside a round close button, drawn as lines so it sits exactly in the middle of the circle. (A "×" or "✕" typed as text is placed by the font, which puts it a
// little high or to one side, and differently in each browser.) The button around it should centre it: display grid with place-items center, or flex.
export default function CloseX({ size = 14, weight = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={weight} strokeLinecap="round" aria-hidden="true" focusable="false" style={{ display: "block" }}>
      <path d="M2.5 2.5l9 9M11.5 2.5l-9 9" />
    </svg>
  );
}
