import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { TRAMMOS_BRAND, styles } from './_brand'

interface MagicLinkEmailProps {
  siteName: string
  // Supabase passes the 6-digit OTP token in the `token` field of the hook
  // payload. We render it prominently. The confirmationUrl is kept as a
  // fallback link in case the user prefers to click instead of typing.
  token?: string
  confirmationUrl?: string
}

export const MagicLinkEmail = ({
  token,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Tu código TRAMMOS: {token ?? '——————'}</Preview>
    <Body style={styles.body}>
      <Section style={styles.outerContainer}>
        <Container style={styles.card}>
          {/* Header con logo */}
          <Section style={styles.header}>
            <Img
              src={TRAMMOS_BRAND.logoUrl}
              alt="TRAMMOS"
              width="56"
              height="56"
              style={styles.logo}
            />
          </Section>
          <hr style={styles.accentBar} />

          {/* Contenido */}
          <Section style={styles.content}>
            <Heading style={styles.h1}>Tu código de acceso</Heading>
            <Text style={styles.text}>
              Usa este código para entrar a tu cuenta TRAMMOS. Es válido por
              unos minutos y solo puede usarse una vez.
            </Text>

            {/* OTP destacado */}
            {token && (
              <Section style={styles.codeBox}>
                <Text style={styles.codeLabel}>Código de 6 dígitos</Text>
                <Text style={styles.codeText}>{token}</Text>
              </Section>
            )}

            <Text style={styles.textMuted}>
              ¿No solicitaste este código? Puedes ignorar este correo, tu
              cuenta sigue segura.
            </Text>

            {confirmationUrl && (
              <>
                <hr style={styles.divider} />
                <Text style={styles.textMuted}>
                  ¿Prefieres entrar con un enlace?{' '}
                  <a href={confirmationUrl} style={styles.link}>
                    Acceder a TRAMMOS
                  </a>
                </Text>
              </>
            )}
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              <strong style={{ color: TRAMMOS_BRAND.text }}>TRAMMOS</strong>{' '}
              · Transportes Especiales
            </Text>
            <Text style={styles.footerText}>
              ¿Necesitas ayuda? Escríbenos a{' '}
              <a href={`mailto:${TRAMMOS_BRAND.supportEmail}`} style={styles.link}>
                {TRAMMOS_BRAND.supportEmail}
              </a>
            </Text>
          </Section>
        </Container>
      </Section>
    </Body>
  </Html>
)

export default MagicLinkEmail
