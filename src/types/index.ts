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
}
