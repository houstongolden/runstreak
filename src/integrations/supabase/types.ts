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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      daily_activities: {
        Row: {
          activity_date: string
          created_at: string
          distance: number
          elevation_gain: number
          id: string
          moving_time: number
          run_count: number
          runner_id: string
          updated_at: string
        }
        Insert: {
          activity_date: string
          created_at?: string
          distance?: number
          elevation_gain?: number
          id?: string
          moving_time?: number
          run_count?: number
          runner_id: string
          updated_at?: string
        }
        Update: {
          activity_date?: string
          created_at?: string
          distance?: number
          elevation_gain?: number
          id?: string
          moving_time?: number
          run_count?: number
          runner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_activities_runner_id_fkey"
            columns: ["runner_id"]
            isOneToOne: false
            referencedRelation: "runners"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_verification_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          phone_number: string
          verified: boolean
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          phone_number: string
          verified?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone_number?: string
          verified?: boolean
        }
        Relationships: []
      }
      runners: {
        Row: {
          all_time_distance: number | null
          all_time_run_count: number | null
          avatar_url: string | null
          average_miles_per_day: number | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          current_streak_days: number | null
          current_streak_miles: number | null
          display_name: string
          id: string
          last_activity_date: string | null
          latitude: number | null
          longest_streak_ever: number | null
          longitude: number | null
          state: string | null
          strava_access_token: string | null
          strava_refresh_token: string | null
          strava_user_id: number | null
          strava_username: string
          streak_start_date: string | null
          streak_status: string | null
          token_expires_at: string | null
          updated_at: string
          x_profile: string | null
          ytd_distance: number | null
          ytd_elevation_gain: number | null
          ytd_moving_time: number | null
          ytd_run_count: number | null
        }
        Insert: {
          all_time_distance?: number | null
          all_time_run_count?: number | null
          avatar_url?: string | null
          average_miles_per_day?: number | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          current_streak_days?: number | null
          current_streak_miles?: number | null
          display_name: string
          id?: string
          last_activity_date?: string | null
          latitude?: number | null
          longest_streak_ever?: number | null
          longitude?: number | null
          state?: string | null
          strava_access_token?: string | null
          strava_refresh_token?: string | null
          strava_user_id?: number | null
          strava_username: string
          streak_start_date?: string | null
          streak_status?: string | null
          token_expires_at?: string | null
          updated_at?: string
          x_profile?: string | null
          ytd_distance?: number | null
          ytd_elevation_gain?: number | null
          ytd_moving_time?: number | null
          ytd_run_count?: number | null
        }
        Update: {
          all_time_distance?: number | null
          all_time_run_count?: number | null
          avatar_url?: string | null
          average_miles_per_day?: number | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          current_streak_days?: number | null
          current_streak_miles?: number | null
          display_name?: string
          id?: string
          last_activity_date?: string | null
          latitude?: number | null
          longest_streak_ever?: number | null
          longitude?: number | null
          state?: string | null
          strava_access_token?: string | null
          strava_refresh_token?: string | null
          strava_user_id?: number | null
          strava_username?: string
          streak_start_date?: string | null
          streak_status?: string | null
          token_expires_at?: string | null
          updated_at?: string
          x_profile?: string | null
          ytd_distance?: number | null
          ytd_elevation_gain?: number | null
          ytd_moving_time?: number | null
          ytd_run_count?: number | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          ai_coach_enabled: boolean | null
          ai_coach_frequency: string | null
          ai_coach_style: string | null
          ai_coach_time: string | null
          created_at: string
          email: string | null
          email_verified: boolean | null
          free_month_claimed: boolean | null
          id: string
          phone_number: string | null
          phone_verified: boolean | null
          runner_id: string
          updated_at: string
        }
        Insert: {
          ai_coach_enabled?: boolean | null
          ai_coach_frequency?: string | null
          ai_coach_style?: string | null
          ai_coach_time?: string | null
          created_at?: string
          email?: string | null
          email_verified?: boolean | null
          free_month_claimed?: boolean | null
          id?: string
          phone_number?: string | null
          phone_verified?: boolean | null
          runner_id: string
          updated_at?: string
        }
        Update: {
          ai_coach_enabled?: boolean | null
          ai_coach_frequency?: string | null
          ai_coach_style?: string | null
          ai_coach_time?: string | null
          created_at?: string
          email?: string | null
          email_verified?: boolean | null
          free_month_claimed?: boolean | null
          id?: string
          phone_number?: string | null
          phone_verified?: boolean | null
          runner_id?: string
          updated_at?: string
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
