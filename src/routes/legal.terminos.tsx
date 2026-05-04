import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { EMPRESA } from "@/lib/legal/empresa";
import { CURRENT_POLICY_VERSION } from "@/lib/legal/version";

export const Route = createFileRoute("/legal/terminos")({
  component: TerminosPage,
  head: () => ({
    meta: [
      { title: "Términos y Condiciones - TRAMMOS" },
      {
        name: "description",
        content:
          "Términos y Condiciones de uso de la plataforma TRAMMOS para operadores y pasajeros.",
      },
    ],
  }),
});

function TerminosPage() {
  return (
    <LegalPageLayout
      titulo="Términos y Condiciones de Uso"
      version={CURRENT_POLICY_VERSION}
    >
      <p>
        Bienvenido a <strong>{EMPRESA.nombreComercial}</strong>. Estos Términos
        y Condiciones regulan el acceso y uso de la plataforma web y móvil
        operada por <strong>{EMPRESA.razonSocial}</strong>, NIT{" "}
        <strong>{EMPRESA.nit}</strong>, en adelante "la Plataforma".
      </p>

      <h2>1. Aceptación</h2>
      <p>
        Al iniciar sesión, registrarte o utilizar la Plataforma, aceptas estos
        Términos y nuestra{" "}
        <Link to="/legal/privacidad">Política de Privacidad</Link>. Si no estás
        de acuerdo, no uses el servicio.
      </p>

      <h2>2. Cuenta y credenciales</h2>
      <ul>
        <li>
          Las credenciales son personales e intransferibles. Eres responsable
          de mantener la confidencialidad de tu contraseña o código de acceso.
        </li>
        <li>
          Debes informar de inmediato cualquier uso no autorizado de tu cuenta
          al correo{" "}
          <a href={`mailto:${EMPRESA.correoSoporte}`}>
            {EMPRESA.correoSoporte}
          </a>
          .
        </li>
        <li>
          TRAMMOS puede suspender o revocar el acceso ante uso indebido,
          fraude o incumplimiento de estos términos.
        </li>
      </ul>

      <h2>3. Conducta esperada</h2>
      <ul>
        <li>
          Brindar trato respetuoso a conductores, pasajeros y personal de
          TRAMMOS.
        </li>
        <li>No suministrar información falsa o suplantar a terceros.</li>
        <li>
          No interferir con el funcionamiento de la Plataforma ni intentar
          acceder a información para la que no tienes autorización.
        </li>
      </ul>

      <h2>4. Servicio de transporte</h2>
      <p>
        TRAMMOS opera servicios de transporte especial coordinados con sus{" "}
        <strong>clientes empresariales</strong>. Las solicitudes generadas por
        la Plataforma se asignan según disponibilidad, ubicación y reglas de
        cada cliente. La aceptación de una solicitud no garantiza
        disponibilidad inmediata cuando exista alta demanda o eventos de
        fuerza mayor.
      </p>

      <h2>5. Propiedad intelectual</h2>
      <p>
        Los contenidos, marcas, código fuente, diseños y bases de datos de la
        Plataforma son propiedad de TRAMMOS o de sus licenciantes y están
        protegidos por la ley colombiana e internacional. Queda prohibida su
        reproducción o uso no autorizado.
      </p>

      <h2>6. Limitación de responsabilidad</h2>
      <p>
        TRAMMOS prestará el servicio con los estándares razonables del sector,
        pero no responde por daños derivados de fallas de conectividad del
        usuario, hechos imputables a terceros, fuerza mayor o caso fortuito.
        Las reclamaciones por incidentes deberán formalizarse por los canales
        oficiales en un plazo razonable.
      </p>

      <h2>7. Modificaciones</h2>
      <p>
        TRAMMOS puede actualizar estos Términos. Los cambios sustanciales se
        comunicarán a través de la Plataforma y, cuando corresponda,
        requerirán nueva aceptación para seguir usando el servicio.
      </p>

      <h2>8. Ley y jurisdicción</h2>
      <p>
        Estos Términos se rigen por las leyes de la República de Colombia.
        Cualquier controversia se someterá a los jueces de {EMPRESA.ciudad}.
      </p>

      <p className="!mt-10 text-sm text-muted-foreground">
        Para soporte escribe a{" "}
        <a href={`mailto:${EMPRESA.correoSoporte}`}>
          {EMPRESA.correoSoporte}
        </a>
        . Para temas de privacidad usa{" "}
        <a href={`mailto:${EMPRESA.correoPrivacidad}`}>
          {EMPRESA.correoPrivacidad}
        </a>
        .
      </p>
    </LegalPageLayout>
  );
}
