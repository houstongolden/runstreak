export interface Company {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  founder_name: string | null;
  founder_handle: string | null;
  pledge_api_key: string;
  stripe_api_key: string | null;
  total_donated: number;
  arr_donated: number;
  created_at: string;
  updated_at: string;
}
