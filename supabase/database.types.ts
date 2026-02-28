Initialising login role...
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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          organization_id: string | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_tenant_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      availabilities: {
        Row: {
          booked_count: number | null
          booking_option_schedule_id: string | null
          booking_option_variation: string | null
          created_at: string | null
          customer_type_ids: string[] | null
          duration_type: string
          end_date: string | null
          experience_id: string | null
          hours_long: number | null
          id: string
          is_repeating: boolean | null
          max_capacity: number | null
          online_booking_status: string | null
          organization_id: string | null
          pricing_schedule_id: string | null
          pricing_tier_id: string | null
          private_announcement: string | null
          repeat_days: string[] | null
          staff_ids: string[] | null
          start_date: string
          start_time: string | null
          status: string | null
          transportation_route_id: string | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          booked_count?: number | null
          booking_option_schedule_id?: string | null
          booking_option_variation?: string | null
          created_at?: string | null
          customer_type_ids?: string[] | null
          duration_type?: string
          end_date?: string | null
          experience_id?: string | null
          hours_long?: number | null
          id?: string
          is_repeating?: boolean | null
          max_capacity?: number | null
          online_booking_status?: string | null
          organization_id?: string | null
          pricing_schedule_id?: string | null
          pricing_tier_id?: string | null
          private_announcement?: string | null
          repeat_days?: string[] | null
          staff_ids?: string[] | null
          start_date: string
          start_time?: string | null
          status?: string | null
          transportation_route_id?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          booked_count?: number | null
          booking_option_schedule_id?: string | null
          booking_option_variation?: string | null
          created_at?: string | null
          customer_type_ids?: string[] | null
          duration_type?: string
          end_date?: string | null
          experience_id?: string | null
          hours_long?: number | null
          id?: string
          is_repeating?: boolean | null
          max_capacity?: number | null
          online_booking_status?: string | null
          organization_id?: string | null
          pricing_schedule_id?: string | null
          pricing_tier_id?: string | null
          private_announcement?: string | null
          repeat_days?: string[] | null
          staff_ids?: string[] | null
          start_date?: string
          start_time?: string | null
          status?: string | null
          transportation_route_id?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availabilities_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availabilities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availabilities_pricing_tier_id_fkey"
            columns: ["pricing_tier_id"]
            isOneToOne: false
            referencedRelation: "pricing_variations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availabilities_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_availabilities_booking_schedule"
            columns: ["booking_option_schedule_id"]
            isOneToOne: false
            referencedRelation: "booking_option_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_availabilities_pricing_schedule"
            columns: ["pricing_schedule_id"]
            isOneToOne: false
            referencedRelation: "pricing_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_assignments: {
        Row: {
          availability_id: string
          created_at: string | null
          driver_id: string | null
          guide_id: string | null
          id: string
          sort_order: number | null
          transportation_route_id: string | null
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          availability_id: string
          created_at?: string | null
          driver_id?: string | null
          guide_id?: string | null
          id?: string
          sort_order?: number | null
          transportation_route_id?: string | null
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          availability_id?: string
          created_at?: string | null
          driver_id?: string | null
          guide_id?: string | null
          id?: string
          sort_order?: number | null
          transportation_route_id?: string | null
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_assignments_availability_id_fkey"
            columns: ["availability_id"]
            isOneToOne: false
            referencedRelation: "availabilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_assignments_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_assignments_transportation_route_id_fkey"
            columns: ["transportation_route_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_assignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_option_schedules: {
        Row: {
          config_custom: Json | null
          config_online: Json | null
          config_retail: Json | null
          config_special: Json | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          organization_id: string | null
          updated_at: string | null
        }
        Insert: {
          config_custom?: Json | null
          config_online?: Json | null
          config_retail?: Json | null
          config_special?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          updated_at?: string | null
        }
        Update: {
          config_custom?: Json | null
          config_online?: Json | null
          config_retail?: Json | null
          config_special?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_option_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          amount_paid: number | null
          availability_id: string
          check_in_status_id: string | null
          confirmation_number: string | null
          created_at: string | null
          customer_id: string
          id: string
          notes: string | null
          option_values: Json | null
          organization_id: string | null
          pax_breakdown: Json | null
          pax_count: number
          payment_details: Json | null
          payment_method: string | null
          payment_status: string | null
          promo_code: string | null
          status: string
          total_amount: number | null
          updated_at: string | null
          voucher_numbers: string | null
        }
        Insert: {
          amount_paid?: number | null
          availability_id: string
          check_in_status_id?: string | null
          confirmation_number?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          notes?: string | null
          option_values?: Json | null
          organization_id?: string | null
          pax_breakdown?: Json | null
          pax_count?: number
          payment_details?: Json | null
          payment_method?: string | null
          payment_status?: string | null
          promo_code?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string | null
          voucher_numbers?: string | null
        }
        Update: {
          amount_paid?: number | null
          availability_id?: string
          check_in_status_id?: string | null
          confirmation_number?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          notes?: string | null
          option_values?: Json | null
          organization_id?: string | null
          pax_breakdown?: Json | null
          pax_count?: number
          payment_details?: Json | null
          payment_method?: string | null
          payment_status?: string | null
          promo_code?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string | null
          voucher_numbers?: string | null
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
            foreignKeyName: "bookings_check_in_status_id_fkey"
            columns: ["check_in_status_id"]
            isOneToOne: false
            referencedRelation: "check_in_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      check_in_statuses: {
        Row: {
          color: string
          created_at: string | null
          id: string
          notes: string | null
          organization_id: string | null
          status: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          status: string
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_in_statuses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cross_organization_access: {
        Row: {
          created_at: string | null
          host_organization_id: string
          id: string
          module_id: string | null
          permission_group_id: string | null
          relationship_type: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          host_organization_id: string
          id?: string
          module_id?: string | null
          permission_group_id?: string | null
          relationship_type: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          host_organization_id?: string
          id?: string
          module_id?: string | null
          permission_group_id?: string | null
          relationship_type?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cross_organization_access_host_organization_id_fkey"
            columns: ["host_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_organization_access_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
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
            foreignKeyName: "cross_organization_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_definitions: {
        Row: {
          created_at: string | null
          default_value: string | null
          description: string | null
          id: string
          is_internal: boolean | null
          label: string
          name: string
          options: Json | null
          organization_id: string | null
          settings: Json | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_value?: string | null
          description?: string | null
          id?: string
          is_internal?: boolean | null
          label: string
          name: string
          options?: Json | null
          organization_id?: string | null
          settings?: Json | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_value?: string | null
          description?: string | null
          id?: string
          is_internal?: boolean | null
          label?: string
          name?: string
          options?: Json | null
          organization_id?: string | null
          settings?: Json | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_definitions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_fields: {
        Row: {
          created_at: string
          description: string | null
          field_type: string
          id: string
          internal_name: string
          is_internal: boolean | null
          options: Json | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          field_type: string
          id?: string
          internal_name: string
          is_internal?: boolean | null
          options?: Json | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          field_type?: string
          id?: string
          internal_name?: string
          is_internal?: boolean | null
          options?: Json | null
          title?: string
        }
        Relationships: []
      }
      customer_types: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          organization_id: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          last_active: string | null
          metadata: Json | null
          organization_id: string | null
          preferences: Json | null
          status: string | null
          tags: string[] | null
          total_value: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          last_active?: string | null
          metadata?: Json | null
          organization_id?: string | null
          preferences?: Json | null
          status?: string | null
          tags?: string[] | null
          total_value?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          last_active?: string | null
          metadata?: Json | null
          organization_id?: string | null
          preferences?: Json | null
          status?: string | null
          tags?: string[] | null
          total_value?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      date_range_presets: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          name: string
          start_date: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          name: string
          start_date: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          user_id?: string | null
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
          organization_id: string | null
          restrictions: string | null
          short_code: string | null
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
          organization_id?: string | null
          restrictions?: string | null
          short_code?: string | null
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
          organization_id?: string | null
          restrictions?: string | null
          short_code?: string | null
          slogan?: string | null
          start_time?: string | null
          transport_details?: string | null
          waiver_link?: string | null
          what_to_bring?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "experiences_tenant_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      hotels: {
        Row: {
          address: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          name: string
          organization_id: string | null
          phone: string | null
          pickup_point_id: string | null
        }
        Insert: {
          address?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          name: string
          organization_id?: string | null
          phone?: string | null
          pickup_point_id?: string | null
        }
        Update: {
          address?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          name?: string
          organization_id?: string | null
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
          {
            foreignKeyName: "hotels_tenant_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      module_resources: {
        Row: {
          default_actions: string[] | null
          id: string
          module_id: string
          resource_code: string
          resource_name: string
        }
        Insert: {
          default_actions?: string[] | null
          id?: string
          module_id: string
          resource_code: string
          resource_name: string
        }
        Update: {
          default_actions?: string[] | null
          id?: string
          module_id?: string
          resource_code?: string
          resource_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_resources_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          code: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          code: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          code?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      organization_subscriptions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          module_code: string | null
          module_id: string
          organization_id: string
          starts_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          module_code?: string | null
          module_id: string
          organization_id: string
          starts_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          module_code?: string | null
          module_id?: string
          organization_id?: string
          starts_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_subscriptions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_subscriptions_tenant_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_users: {
        Row: {
          created_at: string | null
          id: string
          is_organization_owner: boolean | null
          organization_id: string
          primary_position_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_organization_owner?: boolean | null
          organization_id: string
          primary_position_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_organization_owner?: boolean | null
          organization_id?: string
          primary_position_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
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
            foreignKeyName: "organization_users_primary_position_id_fkey"
            columns: ["primary_position_id"]
            isOneToOne: false
            referencedRelation: "staff_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          settings: Json | null
          slug: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          settings?: Json | null
          slug: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          settings?: Json | null
          slug?: string
          status?: string | null
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "pickup_points_tenant_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      position_permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_read: boolean | null
          can_update: boolean | null
          created_at: string | null
          id: string
          module_code: string
          position_id: string
          resource_type: string
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_read?: boolean | null
          can_update?: boolean | null
          created_at?: string | null
          id?: string
          module_code: string
          position_id: string
          resource_type: string
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_read?: boolean | null
          can_update?: boolean | null
          created_at?: string | null
          id?: string
          module_code?: string
          position_id?: string
          resource_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "position_permissions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "staff_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rates: {
        Row: {
          created_at: string
          customer_type_id: string | null
          id: string
          organization_id: string | null
          price: number | null
          schedule_id: string
          tax_percentage: number | null
          tier: string
        }
        Insert: {
          created_at?: string
          customer_type_id?: string | null
          id?: string
          organization_id?: string | null
          price?: number | null
          schedule_id: string
          tax_percentage?: number | null
          tier: string
        }
        Update: {
          created_at?: string
          customer_type_id?: string | null
          id?: string
          organization_id?: string | null
          price?: number | null
          schedule_id?: string
          tax_percentage?: number | null
          tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rates_customer_type_id_fkey"
            columns: ["customer_type_id"]
            isOneToOne: false
            referencedRelation: "customer_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_rates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_rates_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "pricing_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_schedules: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          organization_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          organization_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_variations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          organization_id: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          organization_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_variations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      remix_api_usage: {
        Row: {
          characters_used: number | null
          cost_estimate: number
          created_at: string
          endpoint: string
          id: string
          minutes_used: number | null
          org_id: string
          project_id: string | null
          service: string
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          characters_used?: number | null
          cost_estimate?: number
          created_at?: string
          endpoint: string
          id?: string
          minutes_used?: number | null
          org_id: string
          project_id?: string | null
          service: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          characters_used?: number | null
          cost_estimate?: number
          created_at?: string
          endpoint?: string
          id?: string
          minutes_used?: number | null
          org_id?: string
          project_id?: string | null
          service?: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "remix_api_usage_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "remix_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      remix_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          max_retries: number | null
          progress: number | null
          project_id: string | null
          result: Json | null
          retry_count: number | null
          scene_id: string | null
          source_id: string | null
          started_at: string | null
          status: string
          type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          progress?: number | null
          project_id?: string | null
          result?: Json | null
          retry_count?: number | null
          scene_id?: string | null
          source_id?: string | null
          started_at?: string | null
          status?: string
          type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          progress?: number | null
          project_id?: string | null
          result?: Json | null
          retry_count?: number | null
          scene_id?: string | null
          source_id?: string | null
          started_at?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "remix_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "remix_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remix_jobs_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "remix_scenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remix_jobs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "remix_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      remix_projects: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          org_id: string
          settings: Json
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          org_id: string
          settings?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          settings?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      remix_rendered_videos: {
        Row: {
          created_at: string
          duration_seconds: number | null
          file_path: string
          file_size_bytes: number | null
          id: string
          project_id: string
          render_time_seconds: number | null
          resolution: string | null
          script_id: string
          source_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          file_path: string
          file_size_bytes?: number | null
          id?: string
          project_id: string
          render_time_seconds?: number | null
          resolution?: string | null
          script_id: string
          source_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          file_path?: string
          file_size_bytes?: number | null
          id?: string
          project_id?: string
          render_time_seconds?: number | null
          resolution?: string | null
          script_id?: string
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "remix_rendered_videos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "remix_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remix_rendered_videos_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "remix_scripts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remix_rendered_videos_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "remix_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      remix_scenes: {
        Row: {
          audio_file_path: string | null
          audio_status: string | null
          avatar_status: string | null
          avatar_video_path: string | null
          broll_description: string
          broll_status: string | null
          broll_video_path: string | null
          created_at: string
          dialogue_line: string
          duration_seconds: number
          error_message: string | null
          id: string
          on_screen_text: string | null
          scene_number: number
          script_id: string
        }
        Insert: {
          audio_file_path?: string | null
          audio_status?: string | null
          avatar_status?: string | null
          avatar_video_path?: string | null
          broll_description: string
          broll_status?: string | null
          broll_video_path?: string | null
          created_at?: string
          dialogue_line: string
          duration_seconds: number
          error_message?: string | null
          id?: string
          on_screen_text?: string | null
          scene_number: number
          script_id: string
        }
        Update: {
          audio_file_path?: string | null
          audio_status?: string | null
          avatar_status?: string | null
          avatar_video_path?: string | null
          broll_description?: string
          broll_status?: string | null
          broll_video_path?: string | null
          created_at?: string
          dialogue_line?: string
          duration_seconds?: number
          error_message?: string | null
          id?: string
          on_screen_text?: string | null
          scene_number?: number
          script_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "remix_scenes_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "remix_scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      remix_scripts: {
        Row: {
          created_at: string
          full_script: string
          id: string
          is_selected: boolean | null
          project_id: string
          source_id: string
          target_audience: string | null
          tone: string | null
          total_duration_seconds: number | null
        }
        Insert: {
          created_at?: string
          full_script: string
          id?: string
          is_selected?: boolean | null
          project_id: string
          source_id: string
          target_audience?: string | null
          tone?: string | null
          total_duration_seconds?: number | null
        }
        Update: {
          created_at?: string
          full_script?: string
          id?: string
          is_selected?: boolean | null
          project_id?: string
          source_id?: string
          target_audience?: string | null
          tone?: string | null
          total_duration_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "remix_scripts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "remix_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remix_scripts_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "remix_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      remix_sources: {
        Row: {
          cached_audio_path: string | null
          cached_description: string | null
          cached_thumbnail_path: string | null
          cached_title: string | null
          cached_transcript: string | null
          cached_video_path: string | null
          created_at: string
          id: string
          is_primary: boolean | null
          project_id: string
          scraper_item_id: string
        }
        Insert: {
          cached_audio_path?: string | null
          cached_description?: string | null
          cached_thumbnail_path?: string | null
          cached_title?: string | null
          cached_transcript?: string | null
          cached_video_path?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          project_id: string
          scraper_item_id: string
        }
        Update: {
          cached_audio_path?: string | null
          cached_description?: string | null
          cached_thumbnail_path?: string | null
          cached_title?: string | null
          cached_transcript?: string | null
          cached_video_path?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          project_id?: string
          scraper_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "remix_sources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "remix_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remix_sources_scraper_item_id_fkey"
            columns: ["scraper_item_id"]
            isOneToOne: false
            referencedRelation: "scraper_items"
            referencedColumns: ["id"]
          },
        ]
      }
      remix_thumbnails: {
        Row: {
          analysis: string | null
          created_at: string
          file_path: string
          id: string
          is_selected: boolean | null
          project_id: string
          prompt: string
          source_id: string
        }
        Insert: {
          analysis?: string | null
          created_at?: string
          file_path: string
          id?: string
          is_selected?: boolean | null
          project_id: string
          prompt: string
          source_id: string
        }
        Update: {
          analysis?: string | null
          created_at?: string
          file_path?: string
          id?: string
          is_selected?: boolean | null
          project_id?: string
          prompt?: string
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "remix_thumbnails_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "remix_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remix_thumbnails_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "remix_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      remix_titles: {
        Row: {
          created_at: string
          id: string
          is_selected: boolean | null
          project_id: string
          reasoning: string | null
          source_id: string
          style: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_selected?: boolean | null
          project_id: string
          reasoning?: string | null
          source_id: string
          style: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_selected?: boolean | null
          project_id?: string
          reasoning?: string | null
          source_id?: string
          style?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "remix_titles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "remix_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remix_titles_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "remix_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      report_presets: {
        Row: {
          created_at: string | null
          id: string
          name: string
          settings: Json
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          settings: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          settings?: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_read: boolean | null
          can_update: boolean | null
          id: string
          module_code: string
          resource_type: string
          role_id: string
          scope: Json | null
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_read?: boolean | null
          can_update?: boolean | null
          id?: string
          module_code: string
          resource_type: string
          role_id: string
          scope?: Json | null
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_read?: boolean | null
          can_update?: boolean | null
          id?: string
          module_code?: string
          resource_type?: string
          role_id?: string
          scope?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          organization_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          organization_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_tenant_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_stops: {
        Row: {
          created_at: string | null
          id: string
          order_index: number | null
          organization_id: string | null
          pickup_point_id: string | null
          pickup_time: string | null
          schedule_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_index?: number | null
          organization_id?: string | null
          pickup_point_id?: string | null
          pickup_time?: string | null
          schedule_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_index?: number | null
          organization_id?: string | null
          pickup_point_id?: string | null
          pickup_time?: string | null
          schedule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_stops_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
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
          organization_id: string | null
          start_time: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          organization_id?: string | null
          start_time?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedules_tenant_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      scraper_assets: {
        Row: {
          alt_text: string | null
          asset_type: string
          created_at: string
          duration_seconds: number | null
          file_name: string | null
          file_size_bytes: number | null
          height: number | null
          id: string
          item_id: string
          job_id: string
          metadata: Json | null
          mime_type: string | null
          org_id: string
          original_url: string | null
          storage_path: string | null
          transcript: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          asset_type: string
          created_at?: string
          duration_seconds?: number | null
          file_name?: string | null
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          item_id: string
          job_id: string
          metadata?: Json | null
          mime_type?: string | null
          org_id: string
          original_url?: string | null
          storage_path?: string | null
          transcript?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          asset_type?: string
          created_at?: string
          duration_seconds?: number | null
          file_name?: string | null
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          item_id?: string
          job_id?: string
          metadata?: Json | null
          mime_type?: string | null
          org_id?: string
          original_url?: string | null
          storage_path?: string | null
          transcript?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scraper_assets_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "scraper_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scraper_assets_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "scraper_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      scraper_collections: {
        Row: {
          color: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          org_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          org_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      scraper_items: {
        Row: {
          asset_count: number | null
          body_html: string | null
          body_text: string | null
          collection_id: string | null
          content_type: string
          created_at: string
          description: string | null
          headings_json: Json | null
          id: string
          is_starred: boolean | null
          job_id: string
          links_json: Json | null
          notes: string | null
          org_id: string
          published_at: string | null
          raw_source: string | null
          scraped_at: string
          source_domain: string | null
          source_type: string
          source_url: string
          structured_data_json: Json | null
          tables_json: Json | null
          tags: string[] | null
          title: string | null
          updated_at: string
          word_count: number | null
        }
        Insert: {
          asset_count?: number | null
          body_html?: string | null
          body_text?: string | null
          collection_id?: string | null
          content_type?: string
          created_at?: string
          description?: string | null
          headings_json?: Json | null
          id?: string
          is_starred?: boolean | null
          job_id: string
          links_json?: Json | null
          notes?: string | null
          org_id: string
          published_at?: string | null
          raw_source?: string | null
          scraped_at?: string
          source_domain?: string | null
          source_type: string
          source_url: string
          structured_data_json?: Json | null
          tables_json?: Json | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          word_count?: number | null
        }
        Update: {
          asset_count?: number | null
          body_html?: string | null
          body_text?: string | null
          collection_id?: string | null
          content_type?: string
          created_at?: string
          description?: string | null
          headings_json?: Json | null
          id?: string
          is_starred?: boolean | null
          job_id?: string
          links_json?: Json | null
          notes?: string | null
          org_id?: string
          published_at?: string | null
          raw_source?: string | null
          scraped_at?: string
          source_domain?: string | null
          source_type?: string
          source_url?: string
          structured_data_json?: Json | null
          tables_json?: Json | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scraper_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "scraper_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scraper_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "scraper_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      scraper_jobs: {
        Row: {
          assets_found: number | null
          completed_at: string | null
          config: Json
          created_at: string
          created_by: string
          error_message: string | null
          id: string
          items_found: number | null
          org_id: string
          progress: number | null
          source_type: string
          source_url: string
          started_at: string | null
          status: string
          total_size_bytes: number | null
          updated_at: string
        }
        Insert: {
          assets_found?: number | null
          completed_at?: string | null
          config?: Json
          created_at?: string
          created_by: string
          error_message?: string | null
          id?: string
          items_found?: number | null
          org_id: string
          progress?: number | null
          source_type: string
          source_url: string
          started_at?: string | null
          status?: string
          total_size_bytes?: number | null
          updated_at?: string
        }
        Update: {
          assets_found?: number | null
          completed_at?: string | null
          config?: Json
          created_at?: string
          created_by?: string
          error_message?: string | null
          id?: string
          items_found?: number | null
          org_id?: string
          progress?: number | null
          source_type?: string
          source_url?: string
          started_at?: string | null
          status?: string
          total_size_bytes?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      scraper_metadata: {
        Row: {
          category: string | null
          created_at: string
          id: string
          item_id: string
          key: string
          value: string | null
          value_json: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          item_id: string
          key: string
          value?: string | null
          value_json?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          item_id?: string
          key?: string
          value?: string | null
          value_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "scraper_metadata_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "scraper_items"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string
          id: string
          messaging_app: string | null
          notes: string | null
          organization_id: string | null
          position_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          messaging_app?: string | null
          notes?: string | null
          organization_id?: string | null
          position_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          messaging_app?: string | null
          notes?: string | null
          organization_id?: string | null
          position_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_role_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "staff_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_tenant_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_compensation: {
        Row: {
          id: string
          percent_gross: number | null
          percent_profit: number | null
          rate_per_customer: number | null
          rate_per_day: number | null
          rate_per_hour: number | null
          rate_per_trip: number | null
          salary: number | null
          staff_id: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          percent_gross?: number | null
          percent_profit?: number | null
          rate_per_customer?: number | null
          rate_per_day?: number | null
          rate_per_hour?: number | null
          rate_per_trip?: number | null
          salary?: number | null
          staff_id?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          percent_gross?: number | null
          percent_profit?: number | null
          rate_per_customer?: number | null
          rate_per_day?: number | null
          rate_per_hour?: number | null
          rate_per_trip?: number | null
          salary?: number | null
          staff_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_compensation_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_positions: {
        Row: {
          color: string | null
          created_at: string
          default_role_id: string | null
          description: string | null
          id: string
          name: string
          organization_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          default_role_id?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          default_role_id?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_positions_default_role_id_fkey"
            columns: ["default_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_positions_tenant_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
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
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          is_organization_admin: boolean | null
          is_platform_super_admin: boolean | null
          is_platform_system_admin: boolean | null
          last_login_at: string | null
          messaging_apps: Json | null
          name: string
          nickname: string | null
          notes: string | null
          organization_id: string | null
          password_hash: string | null
          phone_number: string | null
          platform_role: string | null
          state: string | null
          supabase_auth_id: string | null
          temp_password: boolean | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          is_organization_admin?: boolean | null
          is_platform_super_admin?: boolean | null
          is_platform_system_admin?: boolean | null
          last_login_at?: string | null
          messaging_apps?: Json | null
          name: string
          nickname?: string | null
          notes?: string | null
          organization_id?: string | null
          password_hash?: string | null
          phone_number?: string | null
          platform_role?: string | null
          state?: string | null
          supabase_auth_id?: string | null
          temp_password?: boolean | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          is_organization_admin?: boolean | null
          is_platform_super_admin?: boolean | null
          is_platform_system_admin?: boolean | null
          last_login_at?: string | null
          messaging_apps?: Json | null
          name?: string
          nickname?: string | null
          notes?: string | null
          organization_id?: string | null
          password_hash?: string | null
          phone_number?: string | null
          platform_role?: string | null
          state?: string | null
          supabase_auth_id?: string | null
          temp_password?: boolean | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string | null
          per_pax_rate: number | null
          plate_number: string | null
          rate_per_hour: number | null
          status: string
          vendor_id: string | null
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
          organization_id?: string | null
          per_pax_rate?: number | null
          plate_number?: string | null
          rate_per_hour?: number | null
          status?: string
          vendor_id?: string | null
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
          organization_id?: string | null
          per_pax_rate?: number | null
          plate_number?: string | null
          rate_per_hour?: number | null
          status?: string
          vendor_id?: string | null
          vin_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_tenant_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          city: string | null
          contact_name: string | null
          created_at: string | null
          ein_number: string | null
          email: string | null
          id: string
          messaging_handle: string | null
          name: string | null
          organization_id: string | null
          phone: string | null
          preferred_messaging_app: string | null
          state: string | null
          updated_at: string | null
          user_id: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_name?: string | null
          created_at?: string | null
          ein_number?: string | null
          email?: string | null
          id?: string
          messaging_handle?: string | null
          name?: string | null
          organization_id?: string | null
          phone?: string | null
          preferred_messaging_app?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_name?: string | null
          created_at?: string | null
          ein_number?: string | null
          email?: string | null
          id?: string
          messaging_handle?: string | null
          name?: string | null
          organization_id?: string | null
          phone?: string | null
          preferred_messaging_app?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_tenant_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_permissions: {
        Args: { p_user_id: string }
        Returns: {
          can_create: boolean
          can_delete: boolean
          can_read: boolean
          can_update: boolean
          module_code: string
          resource_type: string
        }[]
      }
      user_has_module_access: {
        Args: { p_module_code: string; p_user_id: string }
        Returns: boolean
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
