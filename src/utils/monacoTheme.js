// src/utils/monacoTheme.js

/**
 * Defines a custom Monaco Editor theme that matches the Tremor dark mode colors.
 * This theme is based on the VS Dark theme but with colors adjusted to match
 * the Tremor dark mode palette.
 *
 * @param {Object} monaco - The Monaco Editor instance
 */
export const defineMonacoThemes = (monaco) => {
  monaco.editor.defineTheme('tremor-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      // Background colors
      'editor.background': '#334155', // Match dark-tremor-background-subtle
      'editor.foreground': '#e1e7ef' // Match dark-tremor-content

      // Editor UI colors
      // 'editorCursor.foreground': '#e1e7ef',
      // 'editorLineNumber.foreground': '#64748b', // Muted color for line numbers
      // 'editorLineNumber.activeForeground': '#94a3b8',

      // Selection colors
      // 'editor.selectionBackground': '#334155',
      // 'editor.selectionHighlightBackground': '#334155aa',

      // Syntax highlighting is inherited from vs-dark

      // Scrollbar
      // 'scrollbarSlider.background': '#334155aa',
      // 'scrollbarSlider.hoverBackground': '#475569aa',
      // 'scrollbarSlider.activeBackground': '#64748baa',

      // Line highlight
      // 'editor.lineHighlightBackground': '#1e293b',
      // 'editor.lineHighlightBorder': '#1e293b00',
    }
  });
};

/**
 * Returns the name of the Monaco Editor theme to use based on the current color scheme.
 *
 * @returns {string} The name of the theme to use
 */
export const getMonacoTheme = () => {
  // Check if we're in dark mode
  if (typeof window !== 'undefined') {
    const isDarkMode =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    // You can also check for a dark mode class on the document if your app uses that approach
    const hasDarkClass = document.documentElement.classList.contains('dark');

    if (isDarkMode || hasDarkClass) {
      return 'tremor-dark';
    }
  }

  // Default to light theme
  return 'light';
};
