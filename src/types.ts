export type Bindings = {
  DB: D1Database;
  KAKAO_JAVASCRIPT_KEY: string;
  NAVER_MAP_CLIENT_ID: string;
  NAVER_MAP_CLIENT_SECRET: string;
  NAVER_SEARCH_CLIENT_ID: string;
  NAVER_SEARCH_CLIENT_SECRET: string;
  ALIGO_API_KEY: string;
  ALIGO_USER_ID: string;
  ALIGO_SENDER: string;
  ENVIRONMENT?: string;
}

export interface User {
  id: number;
  kakao_id: string;
  name: string;
  phone?: string;
  created_at: string;
}

export interface SpecialDeal {
  id: number;
  title: string;
  subtitle?: string;
  content: string;
  images: string; // JSON string
  place_name: string;
  place_address: string;
  place_lat?: number;
  place_lng?: number;
  created_at: string;
  like_count?: number;
  gathering_count?: number;
  is_liked?: boolean;
}

export interface Gathering {
  id: number;
  user_id: number;
  special_deal_id: number;
  title: string;
  content: string;
  date_text: string;
  time_text: string;
  place_name: string;
  place_address: string;
  place_lat?: number;
  place_lng?: number;
  max_people: number;
  current_people: number;
  question?: string;
  status: 'open' | 'closed';
  created_at: string;
  user_name?: string;
  like_count?: number;
  is_liked?: boolean;
  application_status?: 'pending' | 'accepted' | 'rejected' | null;
}

export interface GatheringApplication {
  id: number;
  gathering_id: number;
  user_id: number;
  answer?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  user_name?: string;
  user_phone?: string;
}
