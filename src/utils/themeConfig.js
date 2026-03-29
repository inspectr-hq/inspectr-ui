const toCssVarName = (tokenKey) =>
  `--inspectr-${String(tokenKey)
    .trim()
    .replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')}`;

export const buildThemeStyle = (themeConfig) => {
  if (!themeConfig || typeof themeConfig !== 'object') {
    return undefined;
  }

  const style = {};

  const tokenMap =
    themeConfig.tokens && typeof themeConfig.tokens === 'object' ? themeConfig.tokens : themeConfig;

  Object.entries(tokenMap).forEach(([key, value]) => {
    if (value == null || value === '') return;
    style[toCssVarName(key)] = String(value);
  });

  return Object.keys(style).length > 0 ? style : undefined;
};
