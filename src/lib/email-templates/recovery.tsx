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

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Restablece tu contraseña en TRAMMOS</Preview>
    <Body style={styles.body}>
      <Section style={styles.outerContainer}>
        <Container style={styles.card}>
          <Section style={styles.header}>
            <Img src={TRAMMOS_BRAND.logoUrl} alt="TRAMMOS" width="56" height="56" style={styles.logo} />
          </Section>
          <hr style={styles.accentBar} />

          <Section style={styles.content}>
            <Heading style={styles.h1}>Restablece tu contraseña</Heading>
            <Text style={styles.text}>
              Recibimos una solicitud para restablecer tu contraseña en {siteName}. Haz clic en el botón para crear una nueva.
            </Text>
            <div style={{ textAlign: 'center', margin: '28px 0' }}>
              <Button style={styles.button} href={confirmationUrl}>
                Restablecer contraseña
              </Button>
            </div>
            <Text style={styles.textMuted}>
              Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña no será modificada.
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

export default RecoveryEmail
