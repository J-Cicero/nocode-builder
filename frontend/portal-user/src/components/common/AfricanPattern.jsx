export default function AfricanPattern() {
  return (
    <svg
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity: 0.12,
        zIndex: 0,
      }}
      viewBox="0 0 200 200"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="kente-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="40" height="40" fill="none" />
          <polygon points="0,0 20,0 0,20" fill="#C4622D" />
          <polygon points="40,40 20,40 40,20" fill="#C4622D" />
          <polygon points="40,0 20,0 40,20" fill="#C4622D" />
          <polygon points="0,40 0,20 20,40" fill="#C4622D" />
          <path d="M0 20h40M20 0v40" stroke="#C4622D" strokeWidth="2" />
          <path d="M0 0l40 40M40 0L0 40" stroke="#C4622D" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="200" height="200" fill="url(#kente-pattern)" />
    </svg>
  );
}
