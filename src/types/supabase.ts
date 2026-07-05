/**
 * Row shapes for the Nickhub Supabase tables defined in supabase/schema.sql.
 */

export interface UserSettings {
  user_id: string;
  app_name: string;
  tmdb_api_key: string | null;
  debrid_provider: string | null;
  debrid_api_token: string | null;
  binge_mode_enabled: boolean;
  auto_advance_delay_seconds: number;
  preferred_quality: string;
  theme: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
}
