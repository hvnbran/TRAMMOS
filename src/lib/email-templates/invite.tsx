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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Te invitaron a unirte a TRAMMOS</Preview>
    <Body style={styles.body}>
      <Section style={styles.outerContainer}>
        <Container style={styles.card}>
          <Section style={styles.header}>
            <Img src={TRAMMOS_BRAND.logoUrl} alt="TRAMMOS" width="56" height="56" style={styles.logo} />
          </Section>
          <hr style={styles.accentBar} />

          <Section style={styles.content}>
            <Heading style={styles.h1}>Te invitaron a TRAMMOS</Heading>
            <Text style={styles.text}>
              Has sido invitado a unirte a{' '}
              <Link href={siteUrl} style={styles.link}>
                <strong>{siteName}</strong>
              </Link>
              . Acepta la invitación y crea tu cuenta para comenzar.
            </Text>
            <div style={{ textAlign: 'center', margin: '28px 0' }}>
              <Button style={styles.button} href={confirmationUrl}>
                Aceptar invitación
              </Button>
            </div>
            <Text style={styles.textMuted}>
              Si no esperabas esta invitación, puedes ignorar este correo.
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

export default InviteEmail
