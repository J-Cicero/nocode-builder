const ALLOWED_CSS_PROPS = new Set([
  'color',
  'backgroundColor',
  'padding',
  'margin',
  'textAlign',
  'fontSize',
  'fontWeight',
  'borderRadius',
  'borderColor',
  'borderWidth',
  'maxWidth',
  'gap',
]);

const UNSAFE_CSS_VALUE = /url\s*\(|expression\s*\(|javascript:|data:|;|[{}]/i;
const SAFE_COLOR_VALUE = /^#[0-9a-fA-F]{3,8}$|^(rgb|rgba|hsl|hsla)\([0-9.,%\s]+\)$|^[a-zA-Z]{3,20}$/;

export function sanitizeUrl(raw) {
  if (typeof raw !== 'string') {
    return '#';
  }
  const value = raw.trim();
  if (!value) {
    return '#';
  }
  // Reject control characters that could obfuscate schemes
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) {
      return '#';
    }
  }
  if (
    value.startsWith('/') ||
    value.startsWith('./') ||
    value.startsWith('../') ||
    value.startsWith('#')
  ) {
    if (value.startsWith('//')) {
      return '#';
    }
    return value;
  }
  const lower = value.toLowerCase();
  if (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('mailto:') ||
    lower.startsWith('tel:')
  ) {
    return value;
  }
  return '#';
}

export function isInternalRoute(url) {
  const safe = sanitizeUrl(url);
  return safe.startsWith('/') && !safe.startsWith('//');
}

export function sanitizeStyle(rawStyle) {
  if (!rawStyle || typeof rawStyle !== 'object' || Array.isArray(rawStyle)) {
    return {};
  }
  const clean = {};
  for (const [key, val] of Object.entries(rawStyle)) {
    if (!ALLOWED_CSS_PROPS.has(key)) {
      continue;
    }
    if (typeof val === 'number' && Number.isFinite(val)) {
      clean[key] = val;
    } else if (typeof val === 'string' && val.length <= 120 && !UNSAFE_CSS_VALUE.test(val)) {
      clean[key] = val;
    }
  }
  return clean;
}

export function buildThemeStyle(theme) {
  if (!theme || typeof theme !== 'object') {
    return {};
  }
  const mapping = {
    primary: '--color-primary',
    secondary: '--color-secondary',
    background: '--color-bg',
    surface: '--color-surface',
    text: '--color-text',
    text_muted: '--color-muted',
    border: '--color-border',
  };
  const vars = {};
  for (const [key, cssVar] of Object.entries(mapping)) {
    const val = theme[key];
    if (typeof val === 'string' && SAFE_COLOR_VALUE.test(val.trim())) {
      vars[cssVar] = val.trim();
    }
  }
  return vars;
}

export function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function asText(value, fallback = '') {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return fallback;
}
