// src/lib/types.ts

// تحديث واجهة Agreement لتتوافق مع البيانات القادمة من API
export interface Agreement {
  id: number;
  from_id: number;
  to_id: number;
  type: string;
  status: 'active' | 'inactive' | 'pending' | 'completed';
  strength?: number;
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  signed_date?: string;
  created_at?: string;
  
  // حقول إضافية من JOIN
  from_name?: string;
  from_name_ar?: string;
  from_logo?: string;
  to_name?: string;
  to_name_ar?: string;
  to_logo?: string;
  
  // حقول محسوبة للعرض
  from_institution?: {
    id: number;
    name: string;
    name_ar?: string;
    logo?: string;
  };
  to_institution?: {
    id: number;
    name: string;
    name_ar?: string;
    logo?: string;
  };
}

export interface GalaxyStar {
  id: number;
  name: string;
  name_ar?: string;
  type: string;
  size: number;
  brightness: number;
  color: string;
  position: { x: number; y: number; z: number };
  connections: number[];
  weight: number;
  screen_active: boolean;
  country: string;
  city: string;
  is_active?: boolean;
    status?: string; // ✅ إضافة حقل status (قد يكون 'active', 'inactive', etc.)
  // بيانات الاتفاقيات
  agreements?: Agreement[];
  total_agreements?: number;
  active_agreements?: number;
}

export interface GalaxyLink {
  from: number;
  to: number;
  fromPos?: { x: number; y: number; z: number };
  toPos?: { x: number; y: number; z: number };
  type?: string;
  strength?: number;
}

export interface GalaxyData {
  stars: GalaxyStar[];
  links?: GalaxyLink[];
  constellations: any[];
  center: { x: number; y: number; z: number };
  stats: {
    total_stars: number;
    total_constellations: number;
    total_connections: number;
    active_screens: number;
    active_institutions?: number;
    unique_connection_types?: number;
    total_weight?: number;
  };
  timestamp: string;
}

export interface Institution {
  agreements: any;
  id: number;
  name: string;
  name_ar?: string;
  name_en?: string;
  country: string;
  city: string;
  address?: string;
  type: string;
  sub_type?: string;
  registration_number?: string;
  founded_year: number;
  website?: string;
  email?: string;
  phone?: string;
  logo_url?: string;
  social_media?: string;
  employees_count: number;
  projects_count: number;
  beneficiaries_count: number;
  weight: number;
  status: string;
  is_verified: boolean;
  screen_active: boolean;
  screen_password?: string;
  screen_last_active?: string;
  created_at: string;
  updated_at: string;
  description?: string;
}