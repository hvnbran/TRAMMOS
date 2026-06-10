export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      calificaciones: {
        Row: {
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          conductor: string | null
          created_at: string
          created_by: string | null
          estrellas: number
          fecha: string
          id: string
          mejoras: string | null
          nombre: string
          pasajero_id: string | null
          resena: string | null
          servicio: string | null
          solicitud_id: string | null
          tipo: string
          updated_at: string
          vehiculo: string | null
        }
        Insert: {
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          conductor?: string | null
          created_at?: string
          created_by?: string | null
          estrellas: number
          fecha?: string
          id?: string
          mejoras?: string | null
          nombre: string
          pasajero_id?: string | null
          resena?: string | null
          servicio?: string | null
          solicitud_id?: string | null
          tipo: string
          updated_at?: string
          vehiculo?: string | null
        }
        Update: {
          cliente?: Database["public"]["Enums"]["cliente_tipo"]
          conductor?: string | null
          created_at?: string
          created_by?: string | null
          estrellas?: number
          fecha?: string
          id?: string
          mejoras?: string | null
          nombre?: string
          pasajero_id?: string | null
          resena?: string | null
          servicio?: string | null
          solicitud_id?: string | null
          tipo?: string
          updated_at?: string
          vehiculo?: string | null
        }
        Relationships: []
      }
      centros_costo: {
        Row: {
          activo: boolean
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          codigo: string
          created_at: string
          created_by: string | null
          departamento: string | null
          descripcion: string | null
          destino: string
          id: string
          origen: string
          tarifa: number
          tipo: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          codigo: string
          created_at?: string
          created_by?: string | null
          departamento?: string | null
          descripcion?: string | null
          destino: string
          id?: string
          origen: string
          tarifa?: number
          tipo?: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          cliente?: Database["public"]["Enums"]["cliente_tipo"]
          codigo?: string
          created_at?: string
          created_by?: string | null
          departamento?: string | null
          descripcion?: string | null
          destino?: string
          id?: string
          origen?: string
          tarifa?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      conductor_documentos: {
        Row: {
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          conductor_id: string
          created_at: string
          fecha_emision: string | null
          fecha_vencimiento: string | null
          file_name: string
          id: string
          mime_type: string | null
          numero_documento: string | null
          observaciones: string | null
          size_bytes: number | null
          storage_path: string
          tipo: string
          uploaded_by: string | null
          verificado: boolean
        }
        Insert: {
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          conductor_id: string
          created_at?: string
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          file_name: string
          id?: string
          mime_type?: string | null
          numero_documento?: string | null
          observaciones?: string | null
          size_bytes?: number | null
          storage_path: string
          tipo: string
          uploaded_by?: string | null
          verificado?: boolean
        }
        Update: {
          cliente?: Database["public"]["Enums"]["cliente_tipo"]
          conductor_id?: string
          created_at?: string
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          file_name?: string
          id?: string
          mime_type?: string | null
          numero_documento?: string | null
          observaciones?: string | null
          size_bytes?: number | null
          storage_path?: string
          tipo?: string
          uploaded_by?: string | null
          verificado?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "conductor_documentos_conductor_id_fkey"
            columns: ["conductor_id"]
            isOneToOne: false
            referencedRelation: "conductores"
            referencedColumns: ["id"]
          },
        ]
      }
      conductor_ubicaciones: {
        Row: {
          accuracy: number | null
          conductor_id: string
          heading: number | null
          lat: number
          lng: number
          online: boolean
          speed_kmh: number | null
          updated_at: string
        }
        Insert: {
          accuracy?: number | null
          conductor_id: string
          heading?: number | null
          lat: number
          lng: number
          online?: boolean
          speed_kmh?: number | null
          updated_at?: string
        }
        Update: {
          accuracy?: number | null
          conductor_id?: string
          heading?: number | null
          lat?: number
          lng?: number
          online?: boolean
          speed_kmh?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conductor_ubicaciones_conductor_id_fkey"
            columns: ["conductor_id"]
            isOneToOne: true
            referencedRelation: "conductores"
            referencedColumns: ["id"]
          },
        ]
      }
      conductores: {
        Row: {
          acceso_habilitado: boolean
          auth_user_id: string | null
          categoria_lic: string | null
          cedula: string | null
          cliente: Database["public"]["Enums"]["cliente_tipo"] | null
          clientes: Database["public"]["Enums"]["cliente_tipo"][]
          created_at: string
          created_by: string | null
          cumplimiento: number | null
          empresa_id: string | null
          estado: string
          fecha_nacimiento: string | null
          foto_url: string | null
          id: string
          licencia: string | null
          nombre: string
          password_hash: string | null
          password_plain: string | null
          primer_login_at: string | null
          servicios: number | null
          telefono: string | null
          updated_at: string
          vence_licencia: string | null
        }
        Insert: {
          acceso_habilitado?: boolean
          auth_user_id?: string | null
          categoria_lic?: string | null
          cedula?: string | null
          cliente?: Database["public"]["Enums"]["cliente_tipo"] | null
          clientes?: Database["public"]["Enums"]["cliente_tipo"][]
          created_at?: string
          created_by?: string | null
          cumplimiento?: number | null
          empresa_id?: string | null
          estado?: string
          fecha_nacimiento?: string | null
          foto_url?: string | null
          id?: string
          licencia?: string | null
          nombre: string
          password_hash?: string | null
          password_plain?: string | null
          primer_login_at?: string | null
          servicios?: number | null
          telefono?: string | null
          updated_at?: string
          vence_licencia?: string | null
        }
        Update: {
          acceso_habilitado?: boolean
          auth_user_id?: string | null
          categoria_lic?: string | null
          cedula?: string | null
          cliente?: Database["public"]["Enums"]["cliente_tipo"] | null
          clientes?: Database["public"]["Enums"]["cliente_tipo"][]
          created_at?: string
          created_by?: string | null
          cumplimiento?: number | null
          empresa_id?: string | null
          estado?: string
          fecha_nacimiento?: string | null
          foto_url?: string | null
          id?: string
          licencia?: string | null
          nombre?: string
          password_hash?: string | null
          password_plain?: string | null
          primer_login_at?: string | null
          servicios?: number | null
          telefono?: string | null
          updated_at?: string
          vence_licencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conductores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_asesores: {
        Row: {
          activo: boolean
          cargo: string | null
          cedula: string | null
          concesionario_id: string | null
          created_at: string
          created_by: string | null
          email: string | null
          fecha_nacimiento: string | null
          foto_url: string | null
          id: string
          nombre: string
          notas: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          cargo?: string | null
          cedula?: string | null
          concesionario_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          fecha_nacimiento?: string | null
          foto_url?: string | null
          id?: string
          nombre: string
          notas?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          cargo?: string | null
          cedula?: string | null
          concesionario_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          fecha_nacimiento?: string | null
          foto_url?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_asesores_concesionario_id_fkey"
            columns: ["concesionario_id"]
            isOneToOne: false
            referencedRelation: "crm_concesionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_capacidades: {
        Row: {
          cliente_id: string
          created_at: string
          created_by: string | null
          cupo_asignado: number
          cupo_total: number
          documentacion_pendiente: string | null
          entidad: string
          estado: string
          fecha_activacion: string | null
          fecha_vencimiento: string | null
          id: string
          notas: string | null
          rentabilidad_pct: number | null
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          created_by?: string | null
          cupo_asignado?: number
          cupo_total?: number
          documentacion_pendiente?: string | null
          entidad: string
          estado?: string
          fecha_activacion?: string | null
          fecha_vencimiento?: string | null
          id?: string
          notas?: string | null
          rentabilidad_pct?: number | null
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          created_by?: string | null
          cupo_asignado?: number
          cupo_total?: number
          documentacion_pendiente?: string | null
          entidad?: string
          estado?: string
          fecha_activacion?: string | null
          fecha_vencimiento?: string | null
          id?: string
          notas?: string | null
          rentabilidad_pct?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      crm_clientes: {
        Row: {
          asesor_id: string | null
          cedula: string | null
          ciudad: string | null
          concesionario_id: string | null
          created_at: string
          created_by: string | null
          direccion: string | null
          email: string | null
          fecha_nacimiento: string | null
          id: string
          nombre: string
          notas: string | null
          origen: string | null
          telefono: string | null
          temperatura: Database["public"]["Enums"]["crm_temperatura"]
          ultima_interaccion: string | null
          updated_at: string
        }
        Insert: {
          asesor_id?: string | null
          cedula?: string | null
          ciudad?: string | null
          concesionario_id?: string | null
          created_at?: string
          created_by?: string | null
          direccion?: string | null
          email?: string | null
          fecha_nacimiento?: string | null
          id?: string
          nombre: string
          notas?: string | null
          origen?: string | null
          telefono?: string | null
          temperatura?: Database["public"]["Enums"]["crm_temperatura"]
          ultima_interaccion?: string | null
          updated_at?: string
        }
        Update: {
          asesor_id?: string | null
          cedula?: string | null
          ciudad?: string | null
          concesionario_id?: string | null
          created_at?: string
          created_by?: string | null
          direccion?: string | null
          email?: string | null
          fecha_nacimiento?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          origen?: string | null
          telefono?: string | null
          temperatura?: Database["public"]["Enums"]["crm_temperatura"]
          ultima_interaccion?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_clientes_asesor_id_fkey"
            columns: ["asesor_id"]
            isOneToOne: false
            referencedRelation: "crm_asesores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_clientes_concesionario_id_fkey"
            columns: ["concesionario_id"]
            isOneToOne: false
            referencedRelation: "crm_concesionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_concesionarios: {
        Row: {
          activo: boolean
          ciudad: string | null
          created_at: string
          created_by: string | null
          direccion: string | null
          email: string | null
          empresa: string | null
          id: string
          lat: number | null
          lng: number | null
          nit: string | null
          nombre: string
          notas: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          ciudad?: string | null
          created_at?: string
          created_by?: string | null
          direccion?: string | null
          email?: string | null
          empresa?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          nit?: string | null
          nombre: string
          notas?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          ciudad?: string | null
          created_at?: string
          created_by?: string | null
          direccion?: string | null
          email?: string | null
          empresa?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          nit?: string | null
          nombre?: string
          notas?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crm_cotizaciones: {
        Row: {
          archivo_url: string | null
          cliente_id: string
          created_at: string
          created_by: string | null
          estado: string
          id: string
          monto: number
          notas: string | null
          numero: string | null
          oportunidad_id: string | null
          updated_at: string
          vehiculo: string | null
          vigencia_hasta: string | null
        }
        Insert: {
          archivo_url?: string | null
          cliente_id: string
          created_at?: string
          created_by?: string | null
          estado?: string
          id?: string
          monto?: number
          notas?: string | null
          numero?: string | null
          oportunidad_id?: string | null
          updated_at?: string
          vehiculo?: string | null
          vigencia_hasta?: string | null
        }
        Update: {
          archivo_url?: string | null
          cliente_id?: string
          created_at?: string
          created_by?: string | null
          estado?: string
          id?: string
          monto?: number
          notas?: string | null
          numero?: string | null
          oportunidad_id?: string | null
          updated_at?: string
          vehiculo?: string | null
          vigencia_hasta?: string | null
        }
        Relationships: []
      }
      crm_creditos: {
        Row: {
          asesor_id: string | null
          cliente_id: string
          created_at: string
          created_by: string | null
          cuota_inicial: number
          cuota_mensual: number | null
          dias_mora: number
          entidad: string
          estado: string
          fecha_aprobacion: string | null
          fecha_desembolso: string | null
          fecha_solicitud: string
          id: string
          motivo_rechazo: string | null
          notas: string | null
          oportunidad_id: string | null
          plazo_meses: number | null
          saldo_pendiente: number | null
          tasa_mensual: number | null
          updated_at: string
          valor_financiado: number
          venta_id: string | null
        }
        Insert: {
          asesor_id?: string | null
          cliente_id: string
          created_at?: string
          created_by?: string | null
          cuota_inicial?: number
          cuota_mensual?: number | null
          dias_mora?: number
          entidad: string
          estado?: string
          fecha_aprobacion?: string | null
          fecha_desembolso?: string | null
          fecha_solicitud?: string
          id?: string
          motivo_rechazo?: string | null
          notas?: string | null
          oportunidad_id?: string | null
          plazo_meses?: number | null
          saldo_pendiente?: number | null
          tasa_mensual?: number | null
          updated_at?: string
          valor_financiado?: number
          venta_id?: string | null
        }
        Update: {
          asesor_id?: string | null
          cliente_id?: string
          created_at?: string
          created_by?: string | null
          cuota_inicial?: number
          cuota_mensual?: number | null
          dias_mora?: number
          entidad?: string
          estado?: string
          fecha_aprobacion?: string | null
          fecha_desembolso?: string | null
          fecha_solicitud?: string
          id?: string
          motivo_rechazo?: string | null
          notas?: string | null
          oportunidad_id?: string | null
          plazo_meses?: number | null
          saldo_pendiente?: number | null
          tasa_mensual?: number | null
          updated_at?: string
          valor_financiado?: number
          venta_id?: string | null
        }
        Relationships: []
      }
      crm_interacciones: {
        Row: {
          asesor_id: string | null
          cliente_id: string
          created_at: string
          created_by: string | null
          fecha: string
          id: string
          nota: string | null
          oportunidad_id: string | null
          proximo_seguimiento: string | null
          tipo: string
        }
        Insert: {
          asesor_id?: string | null
          cliente_id: string
          created_at?: string
          created_by?: string | null
          fecha?: string
          id?: string
          nota?: string | null
          oportunidad_id?: string | null
          proximo_seguimiento?: string | null
          tipo?: string
        }
        Update: {
          asesor_id?: string | null
          cliente_id?: string
          created_at?: string
          created_by?: string | null
          fecha?: string
          id?: string
          nota?: string | null
          oportunidad_id?: string | null
          proximo_seguimiento?: string | null
          tipo?: string
        }
        Relationships: []
      }
      crm_oportunidades: {
        Row: {
          asesor_id: string | null
          cliente_id: string
          concesionario_id: string | null
          created_at: string
          created_by: string | null
          estado: string
          fecha_cierre_estimada: string | null
          fecha_cierre_real: string | null
          fuente: string | null
          id: string
          motivo_perdida: string | null
          notas: string | null
          probabilidad: number
          titulo: string
          updated_at: string
          valor_estimado: number
          vehiculo_interes: string | null
        }
        Insert: {
          asesor_id?: string | null
          cliente_id: string
          concesionario_id?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_cierre_estimada?: string | null
          fecha_cierre_real?: string | null
          fuente?: string | null
          id?: string
          motivo_perdida?: string | null
          notas?: string | null
          probabilidad?: number
          titulo: string
          updated_at?: string
          valor_estimado?: number
          vehiculo_interes?: string | null
        }
        Update: {
          asesor_id?: string | null
          cliente_id?: string
          concesionario_id?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_cierre_estimada?: string | null
          fecha_cierre_real?: string | null
          fuente?: string | null
          id?: string
          motivo_perdida?: string | null
          notas?: string | null
          probabilidad?: number
          titulo?: string
          updated_at?: string
          valor_estimado?: number
          vehiculo_interes?: string | null
        }
        Relationships: []
      }
      crm_vehiculos_catalogo: {
        Row: {
          activo: boolean
          capacidad_pasajeros: number | null
          costo_referencia: number
          created_at: string
          created_by: string | null
          foto_url: string | null
          id: string
          linea: string
          marca: string
          modelo: string | null
          notas: string | null
          precio_referencia: number
          updated_at: string
          version: string | null
        }
        Insert: {
          activo?: boolean
          capacidad_pasajeros?: number | null
          costo_referencia?: number
          created_at?: string
          created_by?: string | null
          foto_url?: string | null
          id?: string
          linea: string
          marca: string
          modelo?: string | null
          notas?: string | null
          precio_referencia?: number
          updated_at?: string
          version?: string | null
        }
        Update: {
          activo?: boolean
          capacidad_pasajeros?: number | null
          costo_referencia?: number
          created_at?: string
          created_by?: string | null
          foto_url?: string | null
          id?: string
          linea?: string
          marca?: string
          modelo?: string | null
          notas?: string | null
          precio_referencia?: number
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      crm_ventas: {
        Row: {
          asesor_id: string | null
          cliente_id: string
          comision_asesor: number
          comision_asesor_pct: number | null
          comision_trammos: number
          comision_trammos_pct: number | null
          concesionario_id: string | null
          costo: number
          created_at: string
          created_by: string | null
          estado: string
          fecha_entrega: string | null
          fecha_venta: string
          forma_pago: string | null
          id: string
          margen: number | null
          notas: string | null
          numero: string | null
          oportunidad_id: string | null
          placa: string | null
          precio_cliente: number
          updated_at: string
          vehiculo_catalogo_id: string | null
          vehiculo_descripcion: string
        }
        Insert: {
          asesor_id?: string | null
          cliente_id: string
          comision_asesor?: number
          comision_asesor_pct?: number | null
          comision_trammos?: number
          comision_trammos_pct?: number | null
          concesionario_id?: string | null
          costo?: number
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_entrega?: string | null
          fecha_venta?: string
          forma_pago?: string | null
          id?: string
          margen?: number | null
          notas?: string | null
          numero?: string | null
          oportunidad_id?: string | null
          placa?: string | null
          precio_cliente?: number
          updated_at?: string
          vehiculo_catalogo_id?: string | null
          vehiculo_descripcion: string
        }
        Update: {
          asesor_id?: string | null
          cliente_id?: string
          comision_asesor?: number
          comision_asesor_pct?: number | null
          comision_trammos?: number
          comision_trammos_pct?: number | null
          concesionario_id?: string | null
          costo?: number
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_entrega?: string | null
          fecha_venta?: string
          forma_pago?: string | null
          id?: string
          margen?: number | null
          notas?: string | null
          numero?: string | null
          oportunidad_id?: string | null
          placa?: string | null
          precio_cliente?: number
          updated_at?: string
          vehiculo_catalogo_id?: string | null
          vehiculo_descripcion?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      empresas: {
        Row: {
          activo: boolean
          cliente_legacy: Database["public"]["Enums"]["cliente_tipo"] | null
          created_at: string
          created_by: string | null
          id: string
          nombre: string
          slug: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          cliente_legacy?: Database["public"]["Enums"]["cliente_tipo"] | null
          created_at?: string
          created_by?: string | null
          id?: string
          nombre: string
          slug: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          cliente_legacy?: Database["public"]["Enums"]["cliente_tipo"] | null
          created_at?: string
          created_by?: string | null
          id?: string
          nombre?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      facturas: {
        Row: {
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          created_at: string
          created_by: string | null
          estado: string
          fecha_emision: string
          fecha_pago: string | null
          id: string
          monto: number
          notas: string | null
          numero: string
          periodo: string
          servicios_incluidos: number
          updated_at: string
        }
        Insert: {
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_emision?: string
          fecha_pago?: string | null
          id?: string
          monto?: number
          notas?: string | null
          numero: string
          periodo: string
          servicios_incluidos?: number
          updated_at?: string
        }
        Update: {
          cliente?: Database["public"]["Enums"]["cliente_tipo"]
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_emision?: string
          fecha_pago?: string | null
          id?: string
          monto?: number
          notas?: string | null
          numero?: string
          periodo?: string
          servicios_incluidos?: number
          updated_at?: string
        }
        Relationships: []
      }
      formatos_auditoria: {
        Row: {
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          codigo: string
          created_at: string
          created_by: string | null
          entidad: string
          estado: string
          fecha: string
          file_name: string | null
          id: string
          mime_type: string | null
          nombre: string
          notas: string | null
          size_bytes: number | null
          storage_path: string | null
          tipo: string
          updated_at: string
          vehiculos_auditados: number
        }
        Insert: {
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          codigo: string
          created_at?: string
          created_by?: string | null
          entidad: string
          estado?: string
          fecha?: string
          file_name?: string | null
          id?: string
          mime_type?: string | null
          nombre: string
          notas?: string | null
          size_bytes?: number | null
          storage_path?: string | null
          tipo?: string
          updated_at?: string
          vehiculos_auditados?: number
        }
        Update: {
          cliente?: Database["public"]["Enums"]["cliente_tipo"]
          codigo?: string
          created_at?: string
          created_by?: string | null
          entidad?: string
          estado?: string
          fecha?: string
          file_name?: string | null
          id?: string
          mime_type?: string | null
          nombre?: string
          notas?: string | null
          size_bytes?: number | null
          storage_path?: string | null
          tipo?: string
          updated_at?: string
          vehiculos_auditados?: number
        }
        Relationships: []
      }
      incidentes: {
        Row: {
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          conductor: string | null
          created_at: string
          created_by: string | null
          cuando: string | null
          estado: string
          fecha: string
          id: string
          pasajero_id: string | null
          plan_mejoramiento: string | null
          por_que: string | null
          que_paso: string | null
          reportado_por: string
          solicitud_id: string | null
          solucion: string | null
          soporte: string | null
          tipo_incidente: string
          updated_at: string
          vehiculo: string | null
        }
        Insert: {
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          conductor?: string | null
          created_at?: string
          created_by?: string | null
          cuando?: string | null
          estado?: string
          fecha?: string
          id?: string
          pasajero_id?: string | null
          plan_mejoramiento?: string | null
          por_que?: string | null
          que_paso?: string | null
          reportado_por?: string
          solicitud_id?: string | null
          solucion?: string | null
          soporte?: string | null
          tipo_incidente: string
          updated_at?: string
          vehiculo?: string | null
        }
        Update: {
          cliente?: Database["public"]["Enums"]["cliente_tipo"]
          conductor?: string | null
          created_at?: string
          created_by?: string | null
          cuando?: string | null
          estado?: string
          fecha?: string
          id?: string
          pasajero_id?: string | null
          plan_mejoramiento?: string | null
          por_que?: string | null
          que_paso?: string | null
          reportado_por?: string
          solicitud_id?: string | null
          solucion?: string | null
          soporte?: string | null
          tipo_incidente?: string
          updated_at?: string
          vehiculo?: string | null
        }
        Relationships: []
      }
      pasajeros_pcd: {
        Row: {
          alergias: string | null
          auth_user_id: string | null
          autorizado: boolean
          ayudas_tecnicas: string[]
          cedula: string | null
          centros_costo_permitidos: string[]
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          comunicacion_preferida: string
          condiciones_medicas: string | null
          consentimiento_datos: boolean
          contacto_emergencia_nombre: string | null
          contacto_emergencia_relacion: string | null
          contacto_emergencia_telefono: string | null
          created_at: string
          created_by: string | null
          direccion_habitual: string | null
          email: string | null
          empresa_id: string | null
          id: string
          medicamentos: string | null
          nivel_asistencia: number
          nombre: string
          notas_conductor: string | null
          permite_acompanante: boolean
          primer_login_at: string | null
          requiere_vehiculo_adaptado: boolean
          silla_ruedas_medidas: string | null
          telefono: string | null
          tipo_discapacidad: string
          updated_at: string
        }
        Insert: {
          alergias?: string | null
          auth_user_id?: string | null
          autorizado?: boolean
          ayudas_tecnicas?: string[]
          cedula?: string | null
          centros_costo_permitidos?: string[]
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          comunicacion_preferida?: string
          condiciones_medicas?: string | null
          consentimiento_datos?: boolean
          contacto_emergencia_nombre?: string | null
          contacto_emergencia_relacion?: string | null
          contacto_emergencia_telefono?: string | null
          created_at?: string
          created_by?: string | null
          direccion_habitual?: string | null
          email?: string | null
          empresa_id?: string | null
          id?: string
          medicamentos?: string | null
          nivel_asistencia?: number
          nombre: string
          notas_conductor?: string | null
          permite_acompanante?: boolean
          primer_login_at?: string | null
          requiere_vehiculo_adaptado?: boolean
          silla_ruedas_medidas?: string | null
          telefono?: string | null
          tipo_discapacidad?: string
          updated_at?: string
        }
        Update: {
          alergias?: string | null
          auth_user_id?: string | null
          autorizado?: boolean
          ayudas_tecnicas?: string[]
          cedula?: string | null
          centros_costo_permitidos?: string[]
          cliente?: Database["public"]["Enums"]["cliente_tipo"]
          comunicacion_preferida?: string
          condiciones_medicas?: string | null
          consentimiento_datos?: boolean
          contacto_emergencia_nombre?: string | null
          contacto_emergencia_relacion?: string | null
          contacto_emergencia_telefono?: string | null
          created_at?: string
          created_by?: string | null
          direccion_habitual?: string | null
          email?: string | null
          empresa_id?: string | null
          id?: string
          medicamentos?: string | null
          nivel_asistencia?: number
          nombre?: string
          notas_conductor?: string | null
          permite_acompanante?: boolean
          primer_login_at?: string | null
          requiere_vehiculo_adaptado?: boolean
          silla_ruedas_medidas?: string | null
          telefono?: string | null
          tipo_discapacidad?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pasajeros_pcd_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_acceptances: {
        Row: {
          accepted_at: string
          email: string | null
          id: string
          ip: string | null
          metadata: Json
          pasajero_id: string | null
          policy_type: string
          policy_version: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          accepted_at?: string
          email?: string | null
          id?: string
          ip?: string | null
          metadata?: Json
          pasajero_id?: string | null
          policy_type: string
          policy_version: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_at?: string
          email?: string | null
          id?: string
          ip?: string | null
          metadata?: Json
          pasajero_id?: string | null
          policy_type?: string
          policy_version?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_notifications_queue: {
        Row: {
          attempts: number
          body: string
          created_at: string
          data: Json | null
          id: string
          last_error: string | null
          sent_at: string | null
          status: string
          tag: string | null
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          attempts?: number
          body: string
          created_at?: string
          data?: Json | null
          id?: string
          last_error?: string | null
          sent_at?: string | null
          status?: string
          tag?: string | null
          title: string
          url?: string | null
          user_id: string
        }
        Update: {
          attempts?: number
          body?: string
          created_at?: string
          data?: Json | null
          id?: string
          last_error?: string | null
          sent_at?: string | null
          status?: string
          tag?: string | null
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_used_at: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_used_at?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_used_at?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      registro_invitaciones: {
        Row: {
          cliente: Database["public"]["Enums"]["cliente_tipo"] | null
          consumed_user_id: string | null
          created_at: string
          created_by: string | null
          datos_sugeridos: Json
          display_name_sugerido: string | null
          email_sugerido: string | null
          empresa_id: string | null
          expires_at: string
          id: string
          rol: Database["public"]["Enums"]["app_role"] | null
          tipo: string
          token: string
          used_at: string | null
        }
        Insert: {
          cliente?: Database["public"]["Enums"]["cliente_tipo"] | null
          consumed_user_id?: string | null
          created_at?: string
          created_by?: string | null
          datos_sugeridos?: Json
          display_name_sugerido?: string | null
          email_sugerido?: string | null
          empresa_id?: string | null
          expires_at?: string
          id?: string
          rol?: Database["public"]["Enums"]["app_role"] | null
          tipo: string
          token: string
          used_at?: string | null
        }
        Update: {
          cliente?: Database["public"]["Enums"]["cliente_tipo"] | null
          consumed_user_id?: string | null
          created_at?: string
          created_by?: string | null
          datos_sugeridos?: Json
          display_name_sugerido?: string | null
          email_sugerido?: string | null
          empresa_id?: string | null
          expires_at?: string
          id?: string
          rol?: Database["public"]["Enums"]["app_role"] | null
          tipo?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registro_invitaciones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      servicios: {
        Row: {
          asignado_at: string | null
          asignado_by: string | null
          centro_costo: string | null
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          conductor: string | null
          created_at: string
          created_by: string | null
          destino: string | null
          estado: string
          fecha: string
          finalizado_at: string | null
          hora: string | null
          id: string
          iniciado_at: string | null
          numero_orden: string | null
          origen: string | null
          pasajero: string | null
          pasajero_pcd_id: string | null
          updated_at: string
          vehiculo: string | null
        }
        Insert: {
          asignado_at?: string | null
          asignado_by?: string | null
          centro_costo?: string | null
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          conductor?: string | null
          created_at?: string
          created_by?: string | null
          destino?: string | null
          estado?: string
          fecha: string
          finalizado_at?: string | null
          hora?: string | null
          id?: string
          iniciado_at?: string | null
          numero_orden?: string | null
          origen?: string | null
          pasajero?: string | null
          pasajero_pcd_id?: string | null
          updated_at?: string
          vehiculo?: string | null
        }
        Update: {
          asignado_at?: string | null
          asignado_by?: string | null
          centro_costo?: string | null
          cliente?: Database["public"]["Enums"]["cliente_tipo"]
          conductor?: string | null
          created_at?: string
          created_by?: string | null
          destino?: string | null
          estado?: string
          fecha?: string
          finalizado_at?: string | null
          hora?: string | null
          id?: string
          iniciado_at?: string | null
          numero_orden?: string | null
          origen?: string | null
          pasajero?: string | null
          pasajero_pcd_id?: string | null
          updated_at?: string
          vehiculo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "servicios_pasajero_pcd_id_fkey"
            columns: ["pasajero_pcd_id"]
            isOneToOne: false
            referencedRelation: "pasajeros_pcd"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes_pasajero: {
        Row: {
          aceptada_at: string | null
          asignado_at: string | null
          asignado_by: string | null
          cancelado_motivo: string | null
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          conductor_nombre: string | null
          created_at: string
          created_by_pasajero: string
          destino: string
          estado: string
          finalizado_at: string | null
          hora_recogida: string
          id: string
          iniciado_at: string | null
          notas: string | null
          origen: string
          pasajero_pcd_id: string
          programado: boolean
          servicio_id: string | null
          updated_at: string
          vehiculo_placa: string | null
        }
        Insert: {
          aceptada_at?: string | null
          asignado_at?: string | null
          asignado_by?: string | null
          cancelado_motivo?: string | null
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          conductor_nombre?: string | null
          created_at?: string
          created_by_pasajero: string
          destino: string
          estado?: string
          finalizado_at?: string | null
          hora_recogida?: string
          id?: string
          iniciado_at?: string | null
          notas?: string | null
          origen: string
          pasajero_pcd_id: string
          programado?: boolean
          servicio_id?: string | null
          updated_at?: string
          vehiculo_placa?: string | null
        }
        Update: {
          aceptada_at?: string | null
          asignado_at?: string | null
          asignado_by?: string | null
          cancelado_motivo?: string | null
          cliente?: Database["public"]["Enums"]["cliente_tipo"]
          conductor_nombre?: string | null
          created_at?: string
          created_by_pasajero?: string
          destino?: string
          estado?: string
          finalizado_at?: string | null
          hora_recogida?: string
          id?: string
          iniciado_at?: string | null
          notas?: string | null
          origen?: string
          pasajero_pcd_id?: string
          programado?: boolean
          servicio_id?: string | null
          updated_at?: string
          vehiculo_placa?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      trami_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trami_messages: {
        Row: {
          content: string
          context_snapshot: Json | null
          conversation_id: string
          created_at: string
          id: string
          role: string
          tool_name: string | null
          tool_payload: Json | null
          user_id: string
        }
        Insert: {
          content?: string
          context_snapshot?: Json | null
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          tool_name?: string | null
          tool_payload?: Json | null
          user_id: string
        }
        Update: {
          content?: string
          context_snapshot?: Json | null
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          tool_name?: string | null
          tool_payload?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trami_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "trami_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_empresas: {
        Row: {
          created_at: string
          empresa_id: string
          rol_empresa: string
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          rol_empresa?: string
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          rol_empresa?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_empresas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehiculo_conductores: {
        Row: {
          asignado_desde: string
          asignado_hasta: string | null
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          conductor_id: string
          created_at: string
          created_by: string | null
          es_principal: boolean
          id: string
          notas: string | null
          updated_at: string
          vehiculo_id: string
        }
        Insert: {
          asignado_desde?: string
          asignado_hasta?: string | null
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          conductor_id: string
          created_at?: string
          created_by?: string | null
          es_principal?: boolean
          id?: string
          notas?: string | null
          updated_at?: string
          vehiculo_id: string
        }
        Update: {
          asignado_desde?: string
          asignado_hasta?: string | null
          cliente?: Database["public"]["Enums"]["cliente_tipo"]
          conductor_id?: string
          created_at?: string
          created_by?: string | null
          es_principal?: boolean
          id?: string
          notas?: string | null
          updated_at?: string
          vehiculo_id?: string
        }
        Relationships: []
      }
      vehiculo_documentos: {
        Row: {
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          created_at: string
          fecha_emision: string | null
          fecha_vencimiento: string | null
          file_name: string
          id: string
          mime_type: string | null
          numero_documento: string | null
          observaciones: string | null
          size_bytes: number | null
          storage_path: string
          tipo: string
          uploaded_by: string | null
          vehiculo_id: string
          verificado: boolean
        }
        Insert: {
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          created_at?: string
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          file_name: string
          id?: string
          mime_type?: string | null
          numero_documento?: string | null
          observaciones?: string | null
          size_bytes?: number | null
          storage_path: string
          tipo: string
          uploaded_by?: string | null
          vehiculo_id: string
          verificado?: boolean
        }
        Update: {
          cliente?: Database["public"]["Enums"]["cliente_tipo"]
          created_at?: string
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          file_name?: string
          id?: string
          mime_type?: string | null
          numero_documento?: string | null
          observaciones?: string | null
          size_bytes?: number | null
          storage_path?: string
          tipo?: string
          uploaded_by?: string | null
          vehiculo_id?: string
          verificado?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "vehiculo_documentos_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "vehiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      vehiculos: {
        Row: {
          cliente: Database["public"]["Enums"]["cliente_tipo"] | null
          clientes: Database["public"]["Enums"]["cliente_tipo"][]
          color: string | null
          conductor: string | null
          created_at: string
          created_by: string | null
          estado: string
          foto_url: string | null
          id: string
          linea: string | null
          marca: string | null
          modelo: number | null
          num_interno: string | null
          placa: string
          updated_at: string
          vence_rtm: string | null
          vence_soat: string | null
        }
        Insert: {
          cliente?: Database["public"]["Enums"]["cliente_tipo"] | null
          clientes?: Database["public"]["Enums"]["cliente_tipo"][]
          color?: string | null
          conductor?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string
          foto_url?: string | null
          id?: string
          linea?: string | null
          marca?: string | null
          modelo?: number | null
          num_interno?: string | null
          placa: string
          updated_at?: string
          vence_rtm?: string | null
          vence_soat?: string | null
        }
        Update: {
          cliente?: Database["public"]["Enums"]["cliente_tipo"] | null
          clientes?: Database["public"]["Enums"]["cliente_tipo"][]
          color?: string | null
          conductor?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string
          foto_url?: string | null
          id?: string
          linea?: string | null
          marca?: string | null
          modelo?: number | null
          num_interno?: string | null
          placa?: string
          updated_at?: string
          vence_rtm?: string | null
          vence_soat?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_cliente: {
        Args: { _cliente: Database["public"]["Enums"]["cliente_tipo"] }
        Returns: boolean
      }
      can_access_clientes: {
        Args: { _clientes: Database["public"]["Enums"]["cliente_tipo"][] }
        Returns: boolean
      }
      can_access_empresa: { Args: { _empresa_id: string }; Returns: boolean }
      conductor_set_estado_servicio: {
        Args: { _motivo?: string; _nuevo_estado: string; _servicio_id: string }
        Returns: Json
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_conductor_publico_por_nombre: {
        Args: { _nombre: string }
        Returns: {
          nombre: string
          telefono: string
        }[]
      }
      get_pasajero_brief_for_conductor: {
        Args: { _servicio_id: string }
        Returns: Json
      }
      get_ubicacion_conductor_para_pasajero: {
        Args: { _nombre_conductor: string }
        Returns: {
          heading: number
          lat: number
          lng: number
          online: boolean
          speed_kmh: number
          updated_at: string
        }[]
      }
      get_vehiculo_publico_por_placa: {
        Args: { _placa: string }
        Returns: {
          color: string
          foto_url: string
          linea: string
          marca: string
        }[]
      }
      has_crm_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_pasajero_email_authorized: {
        Args: { _email: string }
        Returns: boolean
      }
      link_conductor_to_auth: { Args: { _cedula: string }; Returns: Json }
      link_pasajero_to_auth: { Args: never; Returns: Json }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      set_conductor_password: {
        Args: { _conductor_id: string; _password: string }
        Returns: undefined
      }
      user_client: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["cliente_tipo"]
      }
      user_empresa_ids: { Args: { _user: string }; Returns: string[] }
      verify_conductor_password: {
        Args: { _cedula: string; _password: string }
        Returns: {
          conductor_id: string
          nombre: string
          ok: boolean
        }[]
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "corona"
        | "sodimac"
        | "pasajero"
        | "conductor"
        | "crm"
      cliente_tipo: "corona" | "sodimac"
      crm_temperatura: "frio" | "tibio" | "caliente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "corona", "sodimac", "pasajero", "conductor", "crm"],
      cliente_tipo: ["corona", "sodimac"],
      crm_temperatura: ["frio", "tibio", "caliente"],
    },
  },
} as const
