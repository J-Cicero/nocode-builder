import { useState } from "react";

export default function Input({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  name,
  error,
  icon,
  rightIcon,
  onRightIconClick,
  style = {},
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword && showPassword ? "text" : type;

  const baseInputStyle = {
    width: "100%",
    padding: "12px 16px",
    border: "1.5px solid #E8D9C4",
    borderRadius: 8,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    outline: "none",
    backgroundColor: "#FFFFFF",
    transition: "border 200ms ease, box-shadow 200ms ease",
    paddingLeft: icon ? 44 : 16,
    paddingRight: rightIcon || isPassword ? 44 : 16,
    ...style,
  };

  const wrapperStyle = { display: "flex", flexDirection: "column", gap: 6 };

  const onFocus = (e) => {
    e.currentTarget.style.borderColor = "#C4622D";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(196,98,45,0.15)";
  };
  const onBlur = (e) => {
    e.currentTarget.style.borderColor = error ? "#B03030" : "#E8D9C4";
    e.currentTarget.style.boxShadow = "none";
  };

  const handleRight = () => {
    if (isPassword) {
      setShowPassword((s) => !s);
    } else if (onRightIconClick) {
      onRightIconClick();
    }
  };

  return (
    <div style={wrapperStyle}>
      {label && (
        <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: "#2C1A0E" }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        {icon && (
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#7A5C44" }}>
            {icon}
          </span>
        )}
        <input
          name={name}
          type={resolvedType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          style={{
            ...baseInputStyle,
            borderColor: error ? "#B03030" : baseInputStyle.border,
          }}
        />
        {(rightIcon || isPassword) && (
          <button
            type="button"
            onClick={handleRight}
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
              color: "#7A5C44",
            }}
          >
            {isPassword ? (
              showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10.5 10.5a3 3 0 0 0 4.95 3.036" strokeLinecap="round" strokeLinejoin="round" />
                  <path
                    d="M6.6 6.6C4.6 7.8 3.2 9.65 2.5 12c1.3 4.06 5.1 7 9.5 7 1.24 0 2.44-.2 3.57-.57"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M17.4 17.4c2-1.2 3.4-3.05 4.1-5.4C20.2 7.94 16.4 5 12 5c-.52 0-1.03.04-1.52.12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path
                    d="M2.5 12c1.3-4.06 5.1-7 9.5-7s8.2 2.94 9.5 7c-1.3 4.06-5.1 7-9.5 7s-8.2-2.94-9.5-7Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )
            ) : (
              rightIcon
            )}
          </button>
        )}
      </div>
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#B03030", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B03030" strokeWidth="2">
            <path d="M12 9v4" strokeLinecap="round" />
            <circle cx="12" cy="16" r="0.8" fill="#B03030" />
            <path d="M12 3 3 21h18L12 3Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
