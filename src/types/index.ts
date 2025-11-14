export interface Runner {
  id: string;
  strava_user_id: number | null;
  strava_username: string;
  display_name: string;
  avatar_url: string | null;
  strava_access_token: string | null;
  strava_refresh_token: string | null;
  token_expires_at: string | null;
  current_streak_days: number;
  current_streak_miles: number;
  streak_start_date: string | null;
  last_activity_date: string | null;
  longest_streak_ever: number;
  average_miles_per_day: number;
  streak_status: 'active' | 'broken';
  ytd_run_count: number;
  ytd_distance: number;
  ytd_moving_time: number;
  ytd_elevation_gain: number;
  all_time_run_count: number;
  all_time_distance: number;
  created_at: string;
  updated_at: string;
  x_profile?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface UserSettings {
  id?: string;
  runner_id: string;
  email: string;
  phone_number: string;
  phone_verified: boolean;
  email_verified: boolean;
  ai_coach_enabled: boolean;
  ai_coach_frequency: string;
  ai_coach_time: string;
  ai_coach_style: string;
  free_month_claimed: boolean;
  created_at?: string;
  updated_at?: string;
}
