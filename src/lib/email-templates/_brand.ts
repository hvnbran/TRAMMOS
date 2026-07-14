// Shared TRAMMOS branding for all auth email templates.
// Colors derived from official TRAMMOS palette (Pantone 306C cyan + 389C lime).
// Note: emails MUST use hex/rgb (no oklch, no CSS variables — many email
// clients still don't support modern color spaces).

export const TRAMMOS_BRAND = {
  // Hosted assets (uploaded to Lovable Cloud public storage)
  logoUrl:
    'https://dyxmhwcoudtwwsokfcfw.supabase.co/storage/v1/object/public/email-assets/logo-trammos.png',
  bannerUrl:
    'https://dyxmhwcoudtwwsokfcfw.supabase.co/storage/v1/object/public/email-assets/banner-trammos.png',

  // Brand colors (sRGB equivalents of the OKLCH palette used in the app)
  cyan: '#00CAFF', // Primary — Pantone 306C
  cyanDark: '#0099CC',
  lime: '#C6FF00', // Accent — Pantone 389C
  text: '#1F2937',
  muted: '#6B7280',
  border: '#E5E7EB',
  background: '#F8FAFC',

  siteUrl: 'https://trammos.online',
  supportEmail: 'soporte@trammos.online',
} as const;

// Reusable inline styles (email clients require inline styles)
export const styles = {
  body: {
    backgroundColor: '#ffffff',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    margin: 0,
    padding: 0,
  },
  outerContainer: {
    backgroundColor: TRAMMOS_BRAND.background,
    padding: '32px 16px',
  },
  card: {
    maxWidth: '560px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    overflow: 'hidden' as const,
    border: `1px solid ${TRAMMOS_BRAND.border}`,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
  },
  header: {
    background: `linear-gradient(135deg, ${TRAMMOS_BRAND.cyan} 0%, ${TRAMMOS_BRAND.cyanDark} 100%)`,
    padding: '28px 32px',
    textAlign: 'center' as const,
  },
  logo: {
    height: '56px',
    width: 'auto',
    margin: '0 auto',
    display: 'block',
  },
  accentBar: {
    height: '4px',
    backgroundColor: TRAMMOS_BRAND.lime,
    margin: 0,
    border: 'none',
  },
  content: {
    padding: '32px',
  },
  h1: {
    fontSize: '24px',
    fontWeight: 700 as const,
    color: TRAMMOS_BRAND.text,
    margin: '0 0 16px',
    lineHeight: '1.3',
  },
  text: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: TRAMMOS_BRAND.text,
    margin: '0 0 16px',
  },
  textMuted: {
    fontSize: '13px',
    lineHeight: '1.5',
    color: TRAMMOS_BRAND.muted,
    margin: '0 0 12px',
  },
  link: {
    color: TRAMMOS_BRAND.cyanDark,
    textDecoration: 'underline',
  },
  button: {
    backgroundColor: TRAMMOS_BRAND.cyan,
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 600 as const,
    borderRadius: '10px',
    padding: '14px 28px',
    textDecoration: 'none',
    display: 'inline-block',
  },
  // Big OTP code box — used in magic-link template
  codeBox: {
    backgroundColor: TRAMMOS_BRAND.background,
    border: `2px dashed ${TRAMMOS_BRAND.cyan}`,
    borderRadius: '12px',
    padding: '20px 16px',
    margin: '24px 0',
    textAlign: 'center' as const,
  },
  codeText: {
    fontFamily: '"SF Mono", Menlo, Consolas, monospace',
    fontSize: '36px',
    fontWeight: 700 as const,
    letterSpacing: '8px',
    color: TRAMMOS_BRAND.text,
    margin: 0,
    lineHeight: '1.1',
  },
  codeLabel: {
    fontSize: '11px',
    fontWeight: 600 as const,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    color: TRAMMOS_BRAND.muted,
    margin: '0 0 8px',
  },
  divider: {
    border: 'none',
    borderTop: `1px solid ${TRAMMOS_BRAND.border}`,
    margin: '24px 0',
  },
  footer: {
    padding: '20px 32px 28px',
    textAlign: 'center' as const,
    backgroundColor: TRAMMOS_BRAND.background,
  },
  footerText: {
    fontSize: '12px',
    color: TRAMMOS_BRAND.muted,
    margin: '0 0 4px',
    lineHeight: '1.5',
  },
} as const;
