import * as React from 'react'
import {
  Body,
  Button,
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
  confirmationUrl: string
  token?: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
  token,
}: MagicLinkEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Tu enlace de acceso a TRAMMOS</Preview>
    <Body style={styles.body}>
      <Section style={styles.outerContainer}>
        <Container style={styles.card}>
          <Section style={styles.header}>
            <Img src={TRAMMOS_BRAND.logoUrl} alt="TRAMMOS" width="56" height="56" style={styles.logo} />
          </Section>
          <hr style={styles.accentBar} />

          <Section style={styles.content}>
            <Heading style={styles.h1}>Tu enlace de acceso</Heading>
            <Text style={styles.text}>
              Usa el botón para iniciar sesión en {siteName}. Este enlace expira en pocos minutos.
            </Text>
            <div style={{ textAlign: 'center', margin: '24px 0' }}>
              <Button style={styles.button} href={confirmationUrl}>
                Iniciar sesión
              </Button>
            </div>

            {token ? (
              <Section style={styles.codeBox}>
                <Text style={styles.codeLabel}>O ingresa este código de 6 dígitos</Text>
                <Text style={styles.codeText}>{token}</Text>
              </Section>
            ) : null}

            <Text style={styles.textMuted}>
              Si no solicitaste este acceso, puedes ignorar este correo.
            </Text>
          </Section>

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              <strong style={{ color: TRAMMOS_BRAND.text }}>TRAMMOS</strong> · Transportes Especiales
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
