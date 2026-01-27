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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          last_active: string | null
          metadata: Json | null
          name: string
          phone: string | null
          preferences: Json | null
          status: string | null
          tags: string[] | null
          total_value: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id?: string
          last_active?: string | null
          metadata?: Json | null
          name: string
          phone?: string | null
          preferences?: Json | null
          status?: string | null
          tags?: string[] | null
          total_value?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          last_active?: string | null
          metadata?: Json | null
          name?: string
          phone?: string | null
          preferences?: Json | null
          status?: string | null
          tags?: string[] | null
          total_value?: string | null
        }
        Relationships: []
      }
      experiences: {
        Row: {
          cancellation_policy: string | null
          checkin_details: string | null
          created_at: string | null
          description: string | null
          disclaimer: string | null
          end_time: string | null
          event_type: string | null
          id: string
          is_active: boolean | null
          max_age: number | null
          max_group_size: number | null
          min_age: number | null
          min_group_size: number | null
          name: string
          restrictions: string | null
          slogan: string | null
          start_time: string | null
          transport_details: string | null
          waiver_link: string | null
          what_to_bring: string[] | null
        }
        Insert: {
          cancellation_policy?: string | null
          checkin_details?: string | null
          created_at?: string | null
          description?: string | null
          disclaimer?: string | null
          end_time?: string | null
          event_type?: string | null
          id?: string
          is_active?: boolean | null
          max_age?: number | null
          max_group_size?: number | null
          min_age?: number | null
          min_group_size?: number | null
          name: string
          restrictions?: string | null
          slogan?: string | null
          start_time?: string | null
          transport_details?: string | null
          waiver_link?: string | null
          what_to_bring?: string[] | null
        }
        Update: {
          cancellation_policy?: string | null
          checkin_details?: string | null
          created_at?: string | null
          description?: string | null
          disclaimer?: string | null
          end_time?: string | null
          event_type?: string | null
          id?: string
          is_active?: boolean | null
          max_age?: number | null
          max_group_size?: number | null
          min_age?: number | null
          min_group_size?: number | null
          name?: string
          restrictions?: string | null
          slogan?: string | null
          start_time?: string | null
          transport_details?: string | null
          waiver_link?: string | null
          what_to_bring?: string[] | null
        }
        Relationships: []
      }
      hotels: {
        Row: {
          address: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          name: string
          phone: string | null
          pickup_point_id: string | null
        }
        Insert: {
          address?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          name: string
          phone?: string | null
          pickup_point_id?: string | null
        }
        Update: {
          address?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          name?: string
          phone?: string | null
          pickup_point_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotels_pickup_point_id_fkey"
            columns: ["pickup_point_id"]
            isOneToOne: false
            referencedRelation: "pickup_points"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_points: {
        Row: {
          created_at: string | null
          id: string
          instructions: string | null
          map_link: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          instructions?: string | null
          map_link?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          instructions?: string | null
          map_link?: string | null
          name?: string
        }
        Relationships: []
      }
      schedule_stops: {
        Row: {
          created_at: string | null
          id: string
          order_index: number | null
          pickup_point_id: string | null
          pickup_time: string | null
          schedule_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_index?: number | null
          pickup_point_id?: string | null
          pickup_time?: string | null
          schedule_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_index?: number | null
          pickup_point_id?: string | null
          pickup_time?: string | null
          schedule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_stops_pickup_point_id_fkey"
            columns: ["pickup_point_id"]
            isOneToOne: false
            referencedRelation: "pickup_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_stops_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          created_at: string | null
          id: string
          name: string
          start_time: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          start_time?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          start_time?: string | null
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          capacity: number
          created_at: string | null
          dot_number: string | null
          fixed_rate: number | null
          id: string
          license_requirement: string | null
          miles_per_gallon: number | null
          name: string
          plate_number: string | null
          rate_per_hour: number | null
          status: string
          vin_number: string | null
        }
        Insert: {
          capacity?: number
          created_at?: string | null
          dot_number?: string | null
          fixed_rate?: number | null
          id?: string
          license_requirement?: string | null
          miles_per_gallon?: number | null
          name: string
          plate_number?: string | null
          rate_per_hour?: number | null
          status?: string
          vin_number?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string | null
          dot_number?: string | null
          fixed_rate?: number | null
          id?: string
          license_requirement?: string | null
          miles_per_gallon?: number | null
          name?: string
          plate_number?: string | null
          rate_per_hour?: number | null
          status?: string
          vin_number?: string | null
        }
        Relationships: []
      }
      vendors: {
        Row: {
          id: string
          created_at: string | null
          name: string
          phone: string | null
          email: string | null
          ein_number: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          name: string
          phone?: string | null
          email?: string | null
          ein_number?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          name?: string
          phone?: string | null
          email?: string | null
          ein_number?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
