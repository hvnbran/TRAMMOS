import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { EMPRESA } from "@/lib/legal/empresa";
import { CURRENT_POLICY_VERSION } from "@/lib/legal/version";

export const Route = createFileRoute("/legal/privacidad")({
  component: PrivacidadPage,
  head: () => ({
    meta: [
      { title: "Política de Privacidad - TRAMMOS" },
      {
        name: "description",
        content:
          "Política de Tratamiento de Datos Personales de TRAMMOS conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013 (Colombia).",
      },
    ],
  }),
});

function PrivacidadPage() {
  return (
    <LegalPageLayout
      titulo="Política de Tratamiento de Datos Personales"
      version={CURRENT_POLICY_VERSION}
    >
      <p>
        En cumplimiento de la <strong>Ley 1581 de 2012</strong>, el{" "}
        <strong>Decreto 1377 de 2013</strong> y demás normas concordantes de la
        República de Colombia, <strong>{EMPRESA.nombreComercial}</strong> adopta
        la presente Política de Tratamiento de Datos Personales para garantizar
        el adecuado manejo de la información de los titulares.
      </p>

      <h2>1. Responsable del Tratamiento</h2>
      <ul>
        <li>
          <strong>Razón social:</strong> {EMPRESA.razonSocial}
        </li>
        <li>
          <strong>NIT:</strong> {EMPRESA.nit}
        </li>
        <li>
          <strong>Dirección:</strong> {EMPRESA.direccion}, {EMPRESA.ciudad},{" "}
          {EMPRESA.pais}
        </li>
        <li>
          <strong>Correo:</strong>{" "}
          <a href={`mailto:${EMPRESA.correoPrivacidad}`}>
            {EMPRESA.correoPrivacidad}
          </a>
        </li>
      </ul>

      <h2>2. Finalidades del Tratamiento</h2>
      <p>
        Los datos personales recolectados se tratan para las siguientes
        finalidades, todas relacionadas con el objeto social de TRAMMOS como
        operador de transporte especial:
      </p>
      <ul>
        <li>Prestar el servicio de transporte especial contratado.</li>
        <li>
          Asignar conductores y vehículos, monitorear los viajes en tiempo
          real, atender emergencias en ruta.
        </li>
        <li>
          Generar reportes operativos y de cumplimiento para los{" "}
          <strong>clientes empresariales</strong> que contratan el servicio.
        </li>
        <li>Facturar, recaudar y soportar contablemente la operación.</li>
        <li>
          Atender solicitudes, quejas, reclamos y procesos de mejora del
          servicio.
        </li>
        <li>
          Cumplir obligaciones legales, contractuales y regulatorias del sector
          transporte.
        </li>
      </ul>

      <h2>3. Datos Recolectados</h2>
      <p>
        Según el rol del titular, TRAMMOS puede recolectar:
      </p>
      <ul>
        <li>
          <strong>Datos de identificación y contacto:</strong> nombre, cédula,
          teléfono, correo electrónico, dirección habitual.
        </li>
        <li>
          <strong>Datos del viaje:</strong> origen, destino, ubicación
          aproximada, fecha y hora del servicio.
        </li>
        <li>
          <strong>Datos del conductor o vehículo:</strong> licencia, categoría,
          documentos del vehículo, fechas de vencimiento.
        </li>
        <li>
          <strong>Datos sensibles (pasajeros con discapacidad):</strong>{" "}
          condición de discapacidad, ayudas técnicas requeridas, condiciones
          médicas relevantes para el viaje, alergias, medicamentos, contacto de
          emergencia. Estos datos se tratan únicamente con autorización expresa
          del titular o de su representante legal.
        </li>
      </ul>

      <h2>4. Datos Sensibles</h2>
      <p>
        El titular tiene derecho a no responder preguntas sobre datos
        sensibles. Cuando los suministre, lo hará de manera{" "}
        <strong>libre, previa, expresa e informada</strong>, marcando la
        casilla de consentimiento al momento del registro o aceptando la
        presente política al iniciar sesión en la aplicación.
      </p>

      <h2>5. Derechos del Titular</h2>
      <p>
        Conforme al artículo 8 de la Ley 1581 de 2012, el titular puede:
      </p>
      <ul>
        <li>
          Conocer, actualizar y rectificar sus datos personales frente a
          TRAMMOS.
        </li>
        <li>
          Solicitar prueba de la autorización otorgada para el tratamiento.
        </li>
        <li>
          Ser informado, previa solicitud, sobre el uso que se ha dado a sus
          datos.
        </li>
        <li>
          Presentar quejas ante la <strong>Superintendencia de Industria y
          Comercio (SIC)</strong> por infracciones a la ley.
        </li>
        <li>Revocar la autorización y/o solicitar la supresión del dato.</li>
        <li>Acceder en forma gratuita a sus datos personales.</li>
      </ul>

      <h2>6. Procedimiento para Ejercer Derechos</h2>
      <p>
        Toda solicitud, consulta o reclamo relacionado con el tratamiento de
        datos personales debe enviarse al correo{" "}
        <a href={`mailto:${EMPRESA.correoPrivacidad}`}>
          {EMPRESA.correoPrivacidad}
        </a>{" "}
        indicando: nombre completo, número de identificación, descripción de
        los hechos y la solicitud concreta. Las consultas se atienden en un
        plazo máximo de <strong>diez (10) días hábiles</strong> y los reclamos
        en un plazo máximo de <strong>quince (15) días hábiles</strong>,
        prorrogables conforme a la ley.
      </p>

      <h2>7. Transferencia y Transmisión de Datos</h2>
      <p>
        Los datos personales pueden ser compartidos con los{" "}
        <strong>clientes empresariales</strong> que contratan el servicio de
        transporte (en su rol de destinatarios o encargados del tratamiento) y
        con terceros que presten servicios tecnológicos, contables o de
        soporte a TRAMMOS, todos ellos sujetos a deberes de confidencialidad y
        a las finalidades aquí descritas. No se realizan transferencias
        internacionales sin garantías adecuadas.
      </p>

      <h2>8. Conservación y Seguridad</h2>
      <p>
        TRAMMOS conserva los datos personales mientras subsista la relación
        comercial o de servicio y por los plazos adicionales que exija la
        normativa aplicable (laboral, contable, tributaria). La información se
        protege mediante controles técnicos y administrativos: cifrado en
        tránsito, control de acceso por roles, registros de auditoría y
        políticas internas de seguridad de la información.
      </p>

      <h2>9. Vigencia</h2>
      <p>
        Esta política rige desde el <strong>{CURRENT_POLICY_VERSION}</strong> y
        sustituye versiones anteriores. Cualquier cambio sustancial será
        comunicado a los titulares a través de la aplicación, requiriendo una
        nueva aceptación cuando corresponda.
      </p>

      <p className="!mt-10 text-sm text-muted-foreground">
        ¿Preguntas? Escríbenos a{" "}
        <a href={`mailto:${EMPRESA.correoPrivacidad}`}>
          {EMPRESA.correoPrivacidad}
        </a>
        . Consulta también nuestros{" "}
        <Link to="/legal/terminos" className="underline">
          Términos y Condiciones
        </Link>
        .
      </p>
    </LegalPageLayout>
  );
}
