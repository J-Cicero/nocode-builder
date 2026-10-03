// Design system colors, tokens and semantic variants
export const COLORS = {
  primary: "#C4622D",
  secondary: "#7A5C44",
  background: "#FBF4E9",
  dark: "#2C1A0E",
  darkNav: "#1A0E0A",
  cardBg: "#FFFFFF",
  cardBorder: "#E8D9C4",
  white: "#FFFFFF",
  textPrimary: "#2C1A0E",
  textSecondary: "#7A5C44",
  focusRing: "#C4622D",
  danger: "#EF4444",
  success: "#10B981",
};

export const RADIUS = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  full: "9999px",
};

export const VARIANTS = {
  button: {
    primary: {
      backgroundColor: COLORS.primary,
      color: COLORS.white,
      border: "none",
    },
    secondary: {
      backgroundColor: COLORS.secondary,
      color: COLORS.white,
      border: "none",
    },
    outline: {
      backgroundColor: "transparent",
      color: COLORS.primary,
      border: `1px solid ${COLORS.primary}`,
    },
    ghost: {
      backgroundColor: "transparent",
      color: COLORS.dark,
      border: "none",
    },
  },
  card: {
    default: {
      backgroundColor: COLORS.cardBg,
      border: `1px solid ${COLORS.cardBorder}`,
      borderRadius: RADIUS.md,
    },
    elevated: {
      backgroundColor: COLORS.cardBg,
      border: "none",
      borderRadius: RADIUS.md,
      boxShadow: "0 4px 12px rgba(44, 26, 14, 0.08)",
    },
    outlined: {
      backgroundColor: "transparent",
      border: `2px solid ${COLORS.cardBorder}`,
      borderRadius: RADIUS.md,
    },
  },
};

export const baseStyles = {
  pageBackground: {
    backgroundColor: COLORS.background,
    minHeight: "100%",
  },
  card: VARIANTS.card.default,
  button: {
    ...VARIANTS.button.primary,
    padding: "10px 20px",
    borderRadius: RADIUS.sm,
    cursor: "pointer",
    fontWeight: "600",
  },
  text: {
    color: COLORS.dark,
  },
  secondaryText: {
    color: COLORS.secondary,
  },
};

/**
 * Résout les styles finaux d'un composant en priorisant les tokens du Design System
 * puis en combinant le variant sémantique et les styles personnalisés.
 */
export function getComponentTokenStyle(type, props = {}, customStyles = {}) {
  const variantKey = props.variant || "primary";
  const variantStyles = VARIANTS[type]?.[variantKey] || VARIANTS[type]?.primary || {};

  return {
    ...variantStyles,
    ...customStyles,
  };
}

