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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  token?: string
}

export const SignupEmail = ({
  recipient,
  confirmationUrl,
  token,
}: SignupEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Confirma tu correo en TRAMMOS</Preview>
    <Body style={styles.body}>
      <Section style={styles.outerContainer}>
        <Container style={styles.card}>
          <Section style={styles.header}>
            <Img src={TRAMMOS_BRAND.logoUrl} alt="TRAMMOS" width="56" height="56" style={styles.logo} />
          </Section>
          <hr style={styles.accentBar} />

          <Section style={styles.content}>
            <Heading style={styles.h1}>Confirma tu correo</Heading>
            <Text style={styles.text}>
              Bienvenido a <strong>TRAMMOS</strong>. Para activar tu cuenta{recipient ? ` (${recipient})` : ''},
              confirma tu correo con el código o el botón de abajo.
            </Text>

            {token && (
              <Section style={styles.codeBox}>
                <Text style={styles.codeLabel}>Código de 6 dígitos</Text>
                <Text style={styles.codeText}>{token}</Text>
              </Section>
            )}

            <div style={{ textAlign: 'center', margin: '24px 0' }}>
              <Button style={styles.button} href={confirmationUrl}>
                Confirmar mi correo
              </Button>
            </div>

            <Text style={styles.textMuted}>
              Si no creaste esta cuenta, ignora este correo.
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

export default SignupEmail
