import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { TRAMMOS_BRAND, styles } from './_brand'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Confirma el cambio de correo en TRAMMOS</Preview>
    <Body style={styles.body}>
      <Section style={styles.outerContainer}>
        <Container style={styles.card}>
          <Section style={styles.header}>
            <Img src={TRAMMOS_BRAND.logoUrl} alt="TRAMMOS" width="56" height="56" style={styles.logo} />
          </Section>
          <hr style={styles.accentBar} />

          <Section style={styles.content}>
            <Heading style={styles.h1}>Confirma tu nuevo correo</Heading>
            <Text style={styles.text}>
              Solicitaste cambiar el correo de tu cuenta en {siteName} de{' '}
              <Link href={`mailto:${email}`} style={styles.link}>{email}</Link> a{' '}
              <Link href={`mailto:${newEmail}`} style={styles.link}>{newEmail}</Link>.
            </Text>
            <div style={{ textAlign: 'center', margin: '28px 0' }}>
              <Button style={styles.button} href={confirmationUrl}>
                Confirmar cambio
              </Button>
            </div>
            <Text style={styles.textMuted}>
              Si no solicitaste este cambio, asegura tu cuenta de inmediato.
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

export default EmailChangeEmail
