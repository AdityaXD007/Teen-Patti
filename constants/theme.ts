export const theme = {
  colors: {
    background: '#0D0D0D',
    surface: '#1A1A1A',
    surfaceElevated: '#242424',
    accent: '#C9A84C',
    accentSoft: '#C9A84C22',
    winGreen: '#4CAF50',
    lossRed: '#F44336',
    textPrimary: '#F0F0F0',
    textSecondary: '#888888',
    border: '#2A2A2A',
  },
  typography: {
    title: {
      fontSize: 24,
      fontWeight: 'bold' as const,
      color: '#F0F0F0',
    },
    sectionHeader: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: '#F0F0F0',
    },
    body: {
      fontSize: 16,
      color: '#F0F0F0',
    },
    caption: {
      fontSize: 13,
      color: '#888888',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    full: 9999,
  },
};
