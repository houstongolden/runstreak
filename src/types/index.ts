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
  username?: string | null;
  x_profile?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  ai_analysis?: { insights: { title: string; description: string }[] } | null;
  ai_analysis_updated_at?: string | null;
  // New Strava fields
  email?: string | null;
  sex?: string | null;
  weight?: number | null;
  created_at_strava?: string | null;
  updated_at_strava?: string | null;
  follower_count?: number | null;
  friend_count?: number | null;
  athlete_type?: string | null;
  date_preference?: string | null;
  measurement_preference?: string | null;
  ftp?: number | null;
  clubs?: any[] | null;
  bikes?: any[] | null;
  shoes?: any[] | null;
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
