export default function Loader({ size = 40, fullScreen = false }) {
  const wrapperStyle = fullScreen
    ? { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }
    : { display: "flex", alignItems: "center", justifyContent: "center" };

  return (
    <div style={wrapperStyle}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{ animation: "spin 0.8s linear infinite" }}
      >
        <circle cx="12" cy="12" r="10" stroke="#E8D9C4" strokeWidth="3" fill="none" />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="#C4622D"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
