import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  MapPin, Car, Users, Building2, Bell, Star, AlertTriangle, Phone,
  Calendar, ClipboardList, FileText, Shield, LogIn, UserPlus, Search,
  Download, ChevronRight, Home, Repeat, Heart, Camera, MessageSquare,
  Navigation, CheckCircle2, Clock, Settings, HelpCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/ayuda")({
  component: AyudaPage,
  head: () => ({
    meta: [
      { title: "Instructivo de Uso — TRAMMOS" },
      { name: "description", content: "Guía completa de uso de la app Pasajero y del panel Hospital del Sur Itagüí en TRAMMOS." },
    ],
  }),
});

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
        {n}
      </div>
      <div className="flex-1 pt-1">
        <h4 className="font-semibold mb-1">{title}</h4>
        <div className="text-sm text-muted-foreground space-y-1">{children}</div>
      </div>
    </div>
  );
}

function FeatureRow({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex gap-3 items-start p-3 rounded-lg border bg-card">
      <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}

function AyudaPage() {
  const [tab, setTab] = useState("pasajero");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Instructivo de Uso</h1>
              <p className="text-xs text-muted-foreground">Cómo usar TRAMMOS paso a paso</p>
            </div>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm">Volver</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-2 w-full mb-6">
            <TabsTrigger value="pasajero" className="gap-2">
              <Users className="w-4 h-4" /> App Pasajero
            </TabsTrigger>
            <TabsTrigger value="hospital" className="gap-2">
              <Building2 className="w-4 h-4" /> Hospital del Sur
            </TabsTrigger>
          </TabsList>

          {/* ==================== PASAJERO ==================== */}
          <TabsContent value="pasajero" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle>App Pasajero</CardTitle>
                    <p className="text-sm text-muted-foreground">Solicita servicios de transporte de manera rápida y segura</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Acceso */}
                <section>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <LogIn className="w-5 h-5 text-primary" /> 1. Cómo acceder
                  </h3>
                  <div className="space-y-3">
                    <Step n={1} title="Abrir la app desde tu navegador">
                      Ingresa a la ruta <Badge variant="secondary">/pasajero</Badge>. La primera vez verás una pantalla de bienvenida.
                    </Step>
                    <Step n={2} title="Instalar como aplicación (opcional)">
                      Verás un banner "Instalar app" — al aceptarlo, TRAMMOS se agrega a la pantalla de inicio de tu celular como una app nativa.
                    </Step>
                    <Step n={3} title="Registro o inicio de sesión">
                      Puedes crear una cuenta con tu correo o iniciar sesión si ya tienes una. Los pasajeros del Hospital del Sur reciben su cuenta creada por el administrador.
                    </Step>
                  </div>
                </section>

                {/* Solicitar */}
                <section>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" /> 2. Solicitar un servicio
                  </h3>
                  <div className="space-y-3">
                    <Step n={1} title="Escribe el punto de origen">
                      En el campo <b>"Sales de"</b> escribe la dirección o el nombre de un lugar (ej: "Parque de Belén"). El sistema te mostrará sugerencias por cercanía usando Google Places.
                    </Step>
                    <Step n={2} title="Escribe el destino">
                      Igual que el origen, en el campo <b>"Vas a"</b>. Puedes usar los chips de <b>"Mis destinos favoritos"</b> para rellenar rápido direcciones que uses seguido (casa, oficina, gimnasio…).
                    </Step>
                    <Step n={3} title="Agrega destinos favoritos">
                      Toca <b>"+ Agregar destino"</b> para guardar una dirección con un nombre personalizado. Se guardan en tu dispositivo.
                    </Step>
                    <Step n={4} title="Confirmar la solicitud">
                      Revisa la información y toca <b>"Solicitar servicio"</b>. Tu pedido llega automáticamente al panel de operaciones.
                    </Step>
                  </div>
                </section>

                {/* Durante */}
                <section>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-primary" /> 3. Durante el viaje
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <FeatureRow icon={Car} title="Conductor asignado" desc="Verás la foto, nombre y placa del vehículo que te recogerá." />
                    <FeatureRow icon={MapPin} title="Mini mapa en vivo" desc="Sigue en tiempo real la ubicación del vehículo." />
                    <FeatureRow icon={Phone} title="Contacto directo" desc="Llama o escribe al conductor desde la pantalla del viaje." />
                    <FeatureRow icon={AlertTriangle} title="Reportar incidente" desc="Botón de emergencia para notificar cualquier situación." />
                  </div>
                </section>

                {/* Después */}
                <section>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" /> 4. Al finalizar
                  </h3>
                  <div className="space-y-3">
                    <Step n={1} title="Califica tu servicio">
                      Al terminar el viaje, se abre automáticamente el modal para calificar de 1 a 5 estrellas y dejar un comentario opcional.
                    </Step>
                    <Step n={2} title="Activa notificaciones">
                      En la parte superior puedes activar notificaciones push para enterarte cuando tu conductor esté cerca.
                    </Step>
                  </div>
                </section>

                {/* Botones */}
                <section className="rounded-lg border bg-muted/30 p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" /> Botones principales
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2"><Bell className="w-4 h-4 text-primary" /> Notificaciones push</div>
                    <div className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> Destinos favoritos</div>
                    <div className="flex items-center gap-2"><Search className="w-4 h-4 text-primary" /> Buscar dirección</div>
                    <div className="flex items-center gap-2"><Car className="w-4 h-4 text-primary" /> Solicitar servicio</div>
                    <div className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary" /> Chat con conductor</div>
                    <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-primary" /> Reportar incidente</div>
                  </div>
                </section>

              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== HOSPITAL ==================== */}
          <TabsContent value="hospital" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle>Panel Hospital del Sur Itagüí</CardTitle>
                    <p className="text-sm text-muted-foreground">Gestión completa del servicio de transporte para el hospital</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Acceso */}
                <section>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <LogIn className="w-5 h-5 text-red-600" /> 1. Acceso al panel
                  </h3>
                  <div className="space-y-3">
                    <Step n={1} title="Ingresa a la ruta /login">
                      Usa las credenciales que te entregó el administrador (ej: <Badge variant="secondary">hospitalsur@trammos.test</Badge>).
                    </Step>
                    <Step n={2} title="Panel exclusivo">
                      Verás únicamente los datos relacionados al Hospital del Sur: vehículos, conductores, pasajeros y servicios asignados a la empresa.
                    </Step>
                  </div>
                </section>

                {/* Secciones */}
                <section>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-red-600" /> 2. Secciones disponibles
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <FeatureRow icon={Car} title="Vehículos" desc="Consulta los vehículos asignados al hospital, sus documentos y estado." />
                    <FeatureRow icon={Users} title="Conductores" desc="Ficha completa de cada conductor con foto, documentos y licencia." />
                    <FeatureRow icon={UserPlus} title="Pasajeros" desc="Registra y administra los pasajeros del hospital." />
                    <FeatureRow icon={MapPin} title="Monitoreo" desc="Visualiza en tiempo real los servicios en curso." />
                    <FeatureRow icon={CheckCircle2} title="Cumplimiento ANS" desc="Métricas de cumplimiento de acuerdos de nivel de servicio." />
                    <FeatureRow icon={FileText} title="Servicios" desc="Historial completo de viajes solicitados por pasajeros del hospital." />
                  </div>
                </section>

                {/* Crear pasajero */}
                <section>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-red-600" /> 3. Crear cuenta a un pasajero
                  </h3>
                  <div className="space-y-3">
                    <Step n={1} title="Ir a la sección Cuentas">
                      Desde el menú lateral, selecciona <b>Cuentas</b>. Solo podrás crear cuentas de tipo <b>Pasajero</b>.
                    </Step>
                    <Step n={2} title="Diligencia los datos">
                      Nombre completo, correo, teléfono y contraseña temporal. Al guardar, el pasajero podrá iniciar sesión en la app Pasajero.
                    </Step>
                    <Step n={3} title="El pasajero ya puede pedir servicios">
                      Al ingresar, tendrá 3 chips especiales para seleccionar como origen o destino: <b>San Pío, Santamaría, Calatrava</b>.
                    </Step>
                  </div>
                </section>

                {/* Sedes */}
                <section className="rounded-lg border bg-red-50 dark:bg-red-950/20 p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-red-600" /> Sedes del hospital
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div><b>San Pío:</b> Calle 33 Nº 50 a 25</div>
                    <div><b>Santamaría:</b> Carrera 52 Nº 78-158</div>
                    <div><b>Calatrava:</b> Calle 63 Nº 58FF-11</div>
                  </div>
                </section>

                {/* Consultar */}
                <section>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Search className="w-5 h-5 text-red-600" /> 4. Buscar información rápida
                  </h3>
                  <div className="space-y-3">
                    <Step n={1} title="Usa la barra de búsqueda global">
                      En la parte superior del panel puedes escribir una <b>placa</b> o el <b>nombre de un conductor</b>. Al hacer clic en el resultado, se abre directamente su ficha con toda la información.
                    </Step>
                    <Step n={2} title="Ficha de vehículo">
                      Verás una tabla horizontal con documentos, fecha de vencimiento, descarga y estado. Todo organizado sin desplegables.
                    </Step>
                    <Step n={3} title="Ficha de conductor">
                      Foto, datos personales, licencia y documentos como hoja de vida, SIMIT, exámenes médicos, etc. Algunos se actualizan bajo pedido.
                    </Step>
                  </div>
                </section>

                {/* Alertas */}
                <section>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-red-600" /> 5. Alertas del sistema
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    El panel te avisa automáticamente cuando:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <FeatureRow icon={Clock} title="Documentos por vencer" desc="Licencias, SOAT, tecnomecánica cerca de su fecha límite." />
                    <FeatureRow icon={AlertTriangle} title="Actualización pendiente" desc="Documentos marcados por admin que requieren renovación." />
                    <FeatureRow icon={Calendar} title="Cumpleaños de conductores" desc="Recordatorios para saludar a tu equipo." />
                    <FeatureRow icon={Shield} title="Incidentes reportados" desc="Reportes enviados por pasajeros durante el viaje." />
                  </div>
                </section>

              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 p-4 rounded-lg border bg-muted/30 text-sm text-center text-muted-foreground">
          ¿Necesitas ayuda adicional? Escríbenos y con gusto te acompañamos en el proceso.
        </div>
      </main>
    </div>
  );
}
