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
      accountability_partners: {
        Row: {
          created_at: string
          id: string
          partner_id: string
          requester_id: string
          status: Database["public"]["Enums"]["accountability_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          partner_id: string
          requester_id: string
          status?: Database["public"]["Enums"]["accountability_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          partner_id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["accountability_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accountability_partners_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "runners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accountability_partners_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "runners"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_kudos: {
        Row: {
          activity_date: string
          created_at: string
          given_by_runner_id: string
          id: string
          runner_id: string
        }
        Insert: {
          activity_date: string
          created_at?: string
          given_by_runner_id: string
          id?: string
          runner_id: string
        }
        Update: {
          activity_date?: string
          created_at?: string
          given_by_runner_id?: string
          id?: string
          runner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_kudos_given_by_runner_id_fkey"
            columns: ["given_by_runner_id"]
            isOneToOne: false
            referencedRelation: "runners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_kudos_runner_id_fkey"
            columns: ["runner_id"]
            isOneToOne: false
            referencedRelation: "runners"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_status: {
        Row: {
          activity_date: string
          created_at: string
          id: string
          runner_id: string
          status_text: string
          updated_at: string
        }
        Insert: {
          activity_date: string
          created_at?: string
          id?: string
          runner_id: string
          status_text: string
          updated_at?: string
        }
        Update: {
          activity_date?: string
          created_at?: string
          id?: string
          runner_id?: string
          status_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_status_runner_id_fkey"
            columns: ["runner_id"]
            isOneToOne: false
            referencedRelation: "runners"
            referencedColumns: ["id"]
          },
        ]
      }
      aggregate_stats: {
        Row: {
          active_streaks_count: number
          avg_days_on_streak_improvement: number
          avg_days_on_streak_percentage: number
          created_at: string
          id: string
          stat_date: string
          total_miles_logged: number
          total_users: number
        }
        Insert: {
          active_streaks_count?: number
          avg_days_on_streak_improvement?: number
          avg_days_on_streak_percentage?: number
          created_at?: string
          id?: string
          stat_date?: string
          total_miles_logged?: number
          total_users?: number
        }
        Update: {
          active_streaks_count?: number
          avg_days_on_streak_improvement?: number
          avg_days_on_streak_percentage?: number
          created_at?: string
          id?: string
          stat_date?: string
          total_miles_logged?: number
          total_users?: number
        }
        Relationships: []
      }
      best_efforts: {
        Row: {
          activity_id: number | null
          created_at: string
          distance: number
          elapsed_time: number
          id: string
          moving_time: number
          runner_id: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          activity_id?: number | null
          created_at?: string
          distance: number
          elapsed_time: number
          id?: string
          moving_time: number
          runner_id: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          activity_id?: number | null
          created_at?: string
          distance?: number
          elapsed_time?: number
          id?: string
          moving_time?: number
          runner_id?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      coach_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          runner_id: string
          session_id: string | null
          source: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          runner_id: string
          session_id?: string | null
          source: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          runner_id?: string
          session_id?: string | null
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "coaching_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_sessions: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          runner_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          runner_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          runner_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_sessions_runner_id_fkey"
            columns: ["runner_id"]
            isOneToOne: false
            referencedRelation: "runners"
            referencedColumns: ["id"]
          },
        ]
      }
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
          ai_analysis: Json | null
          ai_analysis_updated_at: string | null
          all_time_distance: number | null
          all_time_run_count: number | null
          athlete_type: string | null
          avatar_url: string | null
          average_miles_per_day: number | null
          bikes: Json | null
          bio: string | null
          city: string | null
          clubs: Json | null
          country: string | null
          created_at: string
          created_at_strava: string | null
          current_streak_days: number | null
          current_streak_miles: number | null
          date_preference: string | null
          days_on_streak_before_joining: number | null
          days_on_streak_last_30: number | null
          days_on_streak_last_60: number | null
          days_on_streak_last_90: number | null
          days_on_streak_since_joining: number | null
          display_name: string
          email: string | null
          follower_count: number | null
          friend_count: number | null
          ftp: number | null
          id: string
          joined_runstreak_at: string | null
          last_activity_date: string | null
          latitude: number | null
          longest_streak_ever: number | null
          longitude: number | null
          measurement_preference: string | null
          sex: string | null
          shoes: Json | null
          state: string | null
          strava_access_token: string | null
          strava_refresh_token: string | null
          strava_user_id: number | null
          strava_username: string
          streak_start_date: string | null
          streak_status: string | null
          token_expires_at: string | null
          total_days_before_joining: number | null
          total_days_since_joining: number | null
          updated_at: string
          updated_at_strava: string | null
          username: string | null
          weight: number | null
          x_profile: string | null
          ytd_distance: number | null
          ytd_elevation_gain: number | null
          ytd_moving_time: number | null
          ytd_run_count: number | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_analysis_updated_at?: string | null
          all_time_distance?: number | null
          all_time_run_count?: number | null
          athlete_type?: string | null
          avatar_url?: string | null
          average_miles_per_day?: number | null
          bikes?: Json | null
          bio?: string | null
          city?: string | null
          clubs?: Json | null
          country?: string | null
          created_at?: string
          created_at_strava?: string | null
          current_streak_days?: number | null
          current_streak_miles?: number | null
          date_preference?: string | null
          days_on_streak_before_joining?: number | null
          days_on_streak_last_30?: number | null
          days_on_streak_last_60?: number | null
          days_on_streak_last_90?: number | null
          days_on_streak_since_joining?: number | null
          display_name: string
          email?: string | null
          follower_count?: number | null
          friend_count?: number | null
          ftp?: number | null
          id?: string
          joined_runstreak_at?: string | null
          last_activity_date?: string | null
          latitude?: number | null
          longest_streak_ever?: number | null
          longitude?: number | null
          measurement_preference?: string | null
          sex?: string | null
          shoes?: Json | null
          state?: string | null
          strava_access_token?: string | null
          strava_refresh_token?: string | null
          strava_user_id?: number | null
          strava_username: string
          streak_start_date?: string | null
          streak_status?: string | null
          token_expires_at?: string | null
          total_days_before_joining?: number | null
          total_days_since_joining?: number | null
          updated_at?: string
          updated_at_strava?: string | null
          username?: string | null
          weight?: number | null
          x_profile?: string | null
          ytd_distance?: number | null
          ytd_elevation_gain?: number | null
          ytd_moving_time?: number | null
          ytd_run_count?: number | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_analysis_updated_at?: string | null
          all_time_distance?: number | null
          all_time_run_count?: number | null
          athlete_type?: string | null
          avatar_url?: string | null
          average_miles_per_day?: number | null
          bikes?: Json | null
          bio?: string | null
          city?: string | null
          clubs?: Json | null
          country?: string | null
          created_at?: string
          created_at_strava?: string | null
          current_streak_days?: number | null
          current_streak_miles?: number | null
          date_preference?: string | null
          days_on_streak_before_joining?: number | null
          days_on_streak_last_30?: number | null
          days_on_streak_last_60?: number | null
          days_on_streak_last_90?: number | null
          days_on_streak_since_joining?: number | null
          display_name?: string
          email?: string | null
          follower_count?: number | null
          friend_count?: number | null
          ftp?: number | null
          id?: string
          joined_runstreak_at?: string | null
          last_activity_date?: string | null
          latitude?: number | null
          longest_streak_ever?: number | null
          longitude?: number | null
          measurement_preference?: string | null
          sex?: string | null
          shoes?: Json | null
          state?: string | null
          strava_access_token?: string | null
          strava_refresh_token?: string | null
          strava_user_id?: number | null
          strava_username?: string
          streak_start_date?: string | null
          streak_status?: string | null
          token_expires_at?: string | null
          total_days_before_joining?: number | null
          total_days_since_joining?: number | null
          updated_at?: string
          updated_at_strava?: string | null
          username?: string | null
          weight?: number | null
          x_profile?: string | null
          ytd_distance?: number | null
          ytd_elevation_gain?: number | null
          ytd_moving_time?: number | null
          ytd_run_count?: number | null
        }
        Relationships: []
      }
      streak_history: {
        Row: {
          average_miles_per_day: number
          created_at: string
          days_count: number
          end_date: string
          id: string
          runner_id: string
          start_date: string
          total_miles: number
          total_runs: number
          updated_at: string
        }
        Insert: {
          average_miles_per_day: number
          created_at?: string
          days_count: number
          end_date: string
          id?: string
          runner_id: string
          start_date: string
          total_miles: number
          total_runs: number
          updated_at?: string
        }
        Update: {
          average_miles_per_day?: number
          created_at?: string
          days_count?: number
          end_date?: string
          id?: string
          runner_id?: string
          start_date?: string
          total_miles?: number
          total_runs?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "streak_history_runner_id_fkey"
            columns: ["runner_id"]
            isOneToOne: false
            referencedRelation: "runners"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "runners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "runners"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          accountability_notifications_enabled: boolean | null
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
          show_strava_follow_prompt: boolean | null
          updated_at: string
        }
        Insert: {
          accountability_notifications_enabled?: boolean | null
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
          show_strava_follow_prompt?: boolean | null
          updated_at?: string
        }
        Update: {
          accountability_notifications_enabled?: boolean | null
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
          show_strava_follow_prompt?: boolean | null
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
      accountability_status: "pending" | "accepted" | "declined"
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
      accountability_status: ["pending", "accepted", "declined"],
    },
  },
} as const
