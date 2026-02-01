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
          id: string
          user_id: string | null
          created_at: string | null
          last_active: string | null
          metadata: Json | null
          preferences: Json | null
          status: string | null
          tags: string[] | null
          total_value: string | null
          organization_id: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          created_at?: string | null
          last_active?: string | null
          metadata?: Json | null
          preferences?: Json | null
          status?: string | null
          tags?: string[] | null
          total_value?: string | null
          organization_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          created_at?: string | null
          last_active?: string | null
          metadata?: Json | null
          preferences?: Json | null
          status?: string | null
          tags?: string[] | null
          total_value?: string | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      bookings: {
        Row: {
          id: string
          availability_id: string | null
          customer_id: string | null
          pax_count: number | null
          pax_breakdown: Json | null
          notes: string | null
          total_amount: number | null
          amount_paid: number | null
          payment_status: string | null
          payment_method: string | null
          check_in_status_id: string | null
          option_values: Json | null
          promo_code: string | null
          confirmation_number: string | null
          created_at: string | null
          organization_id: string | null
        }
        Insert: {
          id?: string
          availability_id?: string | null
          customer_id?: string | null
          pax_count?: number | null
          pax_breakdown?: Json | null
          notes?: string | null
          total_amount?: number | null
          amount_paid?: number | null
          payment_status?: string | null
          payment_method?: string | null
          check_in_status_id?: string | null
          option_values?: Json | null
          promo_code?: string | null
          confirmation_number?: string | null
          created_at?: string | null
          organization_id?: string | null
        }
        Update: {
          id?: string
          availability_id?: string | null
          customer_id?: string | null
          pax_count?: number | null
          pax_breakdown?: Json | null
          notes?: string | null
          total_amount?: number | null
          amount_paid?: number | null
          payment_status?: string | null
          payment_method?: string | null
          check_in_status_id?: string | null
          option_values?: Json | null
          promo_code?: string | null
          confirmation_number?: string | null
          created_at?: string | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_availability_id_fkey"
            columns: ["availability_id"]
            isOneToOne: false
            referencedRelation: "availabilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          }
        ]
      }
      availabilities: {
        Row: {
          id: string
          experience_id: string | null
          start_date: string | null
          end_date: string | null
          start_time: string | null
          end_time: string | null
          max_capacity: number | null
          current_bookings: number | null
          status: string | null
          driver_id: string | null
          guide_id: string | null
          vehicle_id: string | null
          schedule_id: string | null
          pricing_schedule_id: string | null
          created_at: string | null
          organization_id: string | null
        }
        Insert: {
          id?: string
          experience_id?: string | null
          start_date?: string | null
          end_date?: string | null
          start_time?: string | null
          end_time?: string | null
          max_capacity?: number | null
          current_bookings?: number | null
          status?: string | null
          driver_id?: string | null
          guide_id?: string | null
          vehicle_id?: string | null
          schedule_id?: string | null
          pricing_schedule_id?: string | null
          created_at?: string | null
          organization_id?: string | null
        }
        Update: {
          id?: string
          experience_id?: string | null
          start_date?: string | null
          end_date?: string | null
          start_time?: string | null
          end_time?: string | null
          max_capacity?: number | null
          current_bookings?: number | null
          status?: string | null
          driver_id?: string | null
          guide_id?: string | null
          vehicle_id?: string | null
          schedule_id?: string | null
          pricing_schedule_id?: string | null
          created_at?: string | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availabilities_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          }
        ]
      }
      check_in_statuses: {
        Row: {
          id: string
          status: string
          color: string | null
          created_at: string | null
          organization_id: string | null
        }
        Insert: {
          id?: string
          status: string
          color?: string | null
          created_at?: string | null
          organization_id?: string | null
        }
        Update: {
          id?: string
          status?: string
          color?: string | null
          created_at?: string | null
          organization_id?: string | null
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
          organization_id: string | null
        }
        Insert: {
          address?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          name: string
          phone?: string | null
          pickup_point_id?: string | null
          organization_id?: string | null
        }
        Update: {
          address?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          name?: string
          phone?: string | null
          pickup_point_id?: string | null
          organization_id?: string | null
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
          organization_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          instructions?: string | null
          map_link?: string | null
          name: string
          organization_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instructions?: string | null
          map_link?: string | null
          name?: string
          organization_id?: string | null
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
          organization_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          start_time?: string | null
          organization_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          start_time?: string | null
          organization_id?: string | null
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          table_name: string
          record_id: string | null
          old_data: Json | null
          new_data: Json | null
          created_at: string | null
          metadata: Json | null
          organization_id: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          table_name: string
          record_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          created_at?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          table_name?: string
          record_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          created_at?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      vendors: {
        Row: {
          id: string
          user_id: string | null
          created_at: string | null
          ein_number: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          organization_id: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          created_at?: string | null
          ein_number?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          organization_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          created_at?: string | null
          ein_number?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string | null
          settings: Json | null
          status: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string | null
          settings?: Json | null
          status?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string | null
          settings?: Json | null
          status?: string | null
        }
        Relationships: []
      }
      organization_users: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          primary_position_id: string | null
          is_organization_owner: boolean | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          primary_position_id?: string | null
          is_organization_owner?: boolean | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          primary_position_id?: string | null
          is_organization_owner?: boolean | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_users_primary_position_id_fkey"
            columns: ["primary_position_id"]
            isOneToOne: false
            referencedRelation: "staff_positions"
            referencedColumns: ["id"]
          }
        ]
      }
      cross_organization_access: {
        Row: {
          id: string
          user_id: string
          host_organization_id: string
          relationship_type: "partner" | "affiliate"
          module_id: string | null
          permission_group_id: string | null
          status: "active" | "pending" | "revoked" | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          host_organization_id: string
          relationship_type: "partner" | "affiliate"
          module_id?: string | null
          permission_group_id?: string | null
          status?: "active" | "pending" | "revoked" | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          host_organization_id?: string
          relationship_type?: "partner" | "affiliate"
          module_id?: string | null
          permission_group_id?: string | null
          status?: "active" | "pending" | "revoked" | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cross_organization_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_organization_access_host_organization_id_fkey"
            columns: ["host_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_organization_access_permission_group_id_fkey"
            columns: ["permission_group_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_organization_access_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          }
        ]
      }
      modules: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          is_active: boolean | null
        }
        Insert: {
          id?: string
          code: string
          name: string
          description?: string | null
          is_active?: boolean | null
        }
        Update: {
          id?: string
          code?: string
          name?: string
          description?: string | null
          is_active?: boolean | null
        }
        Relationships: []
      }
      module_resources: {
        Row: {
          id: string
          module_id: string
          resource_code: string
          resource_name: string
          default_actions: string[] | null
        }
        Insert: {
          id?: string
          module_id: string
          resource_code: string
          resource_name: string
          default_actions?: string[] | null
        }
        Update: {
          id?: string
          module_id?: string
          resource_code?: string
          resource_name?: string
          default_actions?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "module_resources_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          }
        ]
      }
      organization_subscriptions: {
        Row: {
          id: string
          organization_id: string
          module_id: string
          starts_at: string | null
          expires_at: string | null
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          module_id: string
          starts_at?: string | null
          expires_at?: string | null
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          module_id?: string
          starts_at?: string | null
          expires_at?: string | null
          status?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_subscriptions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          phone_number: string | null
          avatar_url: string | null
          is_platform_super_admin: boolean | null
          is_platform_system_admin: boolean | null
          messaging_apps: Json | null
          notes: string | null

          // Deprecated/Migrating columns
          platform_role: string | null
          organization_id: string | null
          is_organization_admin: boolean | null

          password_hash: string | null
          temp_password: boolean | null
          supabase_auth_id: string | null
          created_at: string | null
          last_login_at: string | null
          is_active: boolean | null
        }
        Insert: {
          id?: string
          email: string
          name: string
          phone_number?: string | null
          avatar_url?: string | null
          is_platform_super_admin?: boolean | null
          is_platform_system_admin?: boolean | null
          messaging_apps?: Json | null
          notes?: string | null

          platform_role?: string | null
          organization_id?: string | null
          is_organization_admin?: boolean | null

          password_hash?: string | null
          temp_password?: boolean | null
          supabase_auth_id?: string | null
          created_at?: string | null
          last_login_at?: string | null
          is_active?: boolean | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          phone_number?: string | null
          avatar_url?: string | null
          is_platform_super_admin?: boolean | null
          is_platform_system_admin?: boolean | null
          messaging_apps?: Json | null
          notes?: string | null

          platform_role?: string | null
          organization_id?: string | null
          is_organization_admin?: boolean | null

          password_hash?: string | null
          temp_password?: boolean | null
          supabase_auth_id?: string | null
          created_at?: string | null
          last_login_at?: string | null
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      roles: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          color: string | null
          is_default: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          color?: string | null
          is_default?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          color?: string | null
          is_default?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      role_permissions: {
        Row: {
          id: string
          role_id: string
          module_code: string
          resource_type: string
          can_create: boolean | null
          can_read: boolean | null
          can_update: boolean | null
          can_delete: boolean | null
          scope: Json | null
        }
        Insert: {
          id?: string
          role_id: string
          module_code: string
          resource_type: string
          can_create?: boolean | null
          can_read?: boolean | null
          can_update?: boolean | null
          can_delete?: boolean | null
          scope?: Json | null
        }
        Update: {
          id?: string
          role_id?: string
          module_code?: string
          resource_type?: string
          can_create?: boolean | null
          can_read?: boolean | null
          can_update?: boolean | null
          can_delete?: boolean | null
          scope?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role_id: string
          assigned_at: string | null
          assigned_by: string | null
        }
        Insert: {
          id?: string
          user_id: string
          role_id: string
          assigned_at?: string | null
          assigned_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          role_id?: string
          assigned_at?: string | null
          assigned_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          }
        ]
      }
      staff: {
        Row: {
          id: string
          user_id: string | null
          position_id: string | null
          notes: string | null
          is_active: boolean | null
          driver_license: string | null
          guide_license: string | null
          created_at: string | null
          organization_id: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          position_id?: string | null
          notes?: string | null
          is_active?: boolean | null
          driver_license?: string | null
          guide_license?: string | null
          created_at?: string | null
          organization_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          position_id?: string | null
          notes?: string | null
          is_active?: boolean | null
          driver_license?: string | null
          guide_license?: string | null
          created_at?: string | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "staff_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      staff_positions: {
        Row: {
          id: string
          name: string
          created_at: string | null
          organization_id: string | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string | null
          organization_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_positions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
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
