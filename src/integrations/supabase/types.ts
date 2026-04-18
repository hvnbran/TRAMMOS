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
          created_at: string
          created_by: string | null
          estrellas: number
          fecha: string
          id: string
          mejoras: string | null
          nombre: string
          servicio: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          created_at?: string
          created_by?: string | null
          estrellas: number
          fecha?: string
          id?: string
          mejoras?: string | null
          nombre: string
          servicio?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          cliente?: Database["public"]["Enums"]["cliente_tipo"]
          created_at?: string
          created_by?: string | null
          estrellas?: number
          fecha?: string
          id?: string
          mejoras?: string | null
          nombre?: string
          servicio?: string | null
          tipo?: string
          updated_at?: string
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
          file_name: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
          tipo: string
          uploaded_by: string | null
        }
        Insert: {
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          conductor_id: string
          created_at?: string
          file_name: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
          tipo: string
          uploaded_by?: string | null
        }
        Update: {
          cliente?: Database["public"]["Enums"]["cliente_tipo"]
          conductor_id?: string
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
          tipo?: string
          uploaded_by?: string | null
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
      conductores: {
        Row: {
          categoria_lic: string | null
          cedula: string | null
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          created_at: string
          created_by: string | null
          cumplimiento: number | null
          estado: string
          id: string
          licencia: string | null
          nombre: string
          servicios: number | null
          telefono: string | null
          updated_at: string
          vence_licencia: string | null
        }
        Insert: {
          categoria_lic?: string | null
          cedula?: string | null
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          created_at?: string
          created_by?: string | null
          cumplimiento?: number | null
          estado?: string
          id?: string
          licencia?: string | null
          nombre: string
          servicios?: number | null
          telefono?: string | null
          updated_at?: string
          vence_licencia?: string | null
        }
        Update: {
          categoria_lic?: string | null
          cedula?: string | null
          cliente?: Database["public"]["Enums"]["cliente_tipo"]
          created_at?: string
          created_by?: string | null
          cumplimiento?: number | null
          estado?: string
          id?: string
          licencia?: string | null
          nombre?: string
          servicios?: number | null
          telefono?: string | null
          updated_at?: string
          vence_licencia?: string | null
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
          plan_mejoramiento: string | null
          por_que: string | null
          que_paso: string | null
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
          plan_mejoramiento?: string | null
          por_que?: string | null
          que_paso?: string | null
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
          plan_mejoramiento?: string | null
          por_que?: string | null
          que_paso?: string | null
          solucion?: string | null
          soporte?: string | null
          tipo_incidente?: string
          updated_at?: string
          vehiculo?: string | null
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
      servicios: {
        Row: {
          centro_costo: string | null
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          conductor: string | null
          created_at: string
          created_by: string | null
          destino: string | null
          estado: string
          fecha: string
          hora: string | null
          id: string
          numero_orden: string | null
          origen: string | null
          pasajero: string | null
          updated_at: string
          vehiculo: string | null
        }
        Insert: {
          centro_costo?: string | null
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          conductor?: string | null
          created_at?: string
          created_by?: string | null
          destino?: string | null
          estado?: string
          fecha: string
          hora?: string | null
          id?: string
          numero_orden?: string | null
          origen?: string | null
          pasajero?: string | null
          updated_at?: string
          vehiculo?: string | null
        }
        Update: {
          centro_costo?: string | null
          cliente?: Database["public"]["Enums"]["cliente_tipo"]
          conductor?: string | null
          created_at?: string
          created_by?: string | null
          destino?: string | null
          estado?: string
          fecha?: string
          hora?: string | null
          id?: string
          numero_orden?: string | null
          origen?: string | null
          pasajero?: string | null
          updated_at?: string
          vehiculo?: string | null
        }
        Relationships: []
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
      vehiculo_documentos: {
        Row: {
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          created_at: string
          file_name: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
          tipo: string
          uploaded_by: string | null
          vehiculo_id: string
        }
        Insert: {
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          created_at?: string
          file_name: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
          tipo: string
          uploaded_by?: string | null
          vehiculo_id: string
        }
        Update: {
          cliente?: Database["public"]["Enums"]["cliente_tipo"]
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
          tipo?: string
          uploaded_by?: string | null
          vehiculo_id?: string
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
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          color: string | null
          conductor: string | null
          created_at: string
          created_by: string | null
          estado: string
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
          cliente: Database["public"]["Enums"]["cliente_tipo"]
          color?: string | null
          conductor?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string
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
          cliente?: Database["public"]["Enums"]["cliente_tipo"]
          color?: string | null
          conductor?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_client: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["cliente_tipo"]
      }
    }
    Enums: {
      app_role: "admin" | "corona" | "sodimac"
      cliente_tipo: "corona" | "sodimac"
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
      app_role: ["admin", "corona", "sodimac"],
      cliente_tipo: ["corona", "sodimac"],
    },
  },
} as const
