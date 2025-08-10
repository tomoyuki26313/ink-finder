export interface Studio {
  id: string | number; // Support both string (for local) and number (for database)
  name_ja: string;
  name_en: string;
  bio_ja: string;
  bio_en: string;
  location: string;
  address_ja: string;
  address_en: string;
  instagram_handle: string;
  instagram_posts: string[];
  booking_url: string;
  phone?: string;
  website?: string;
  view_count: number;
  created_at: string;
  
  // Studio amenities and features
  speaks_english?: boolean;
  speaks_chinese?: boolean;
  speaks_korean?: boolean;
  lgbtq_friendly?: boolean;
  same_day_booking?: boolean;
  private_room?: boolean;
  parking_available?: boolean;
  credit_card_accepted?: boolean;
  digital_payment_accepted?: boolean;
  late_night_hours?: boolean;
  weekend_hours?: boolean;
  jagua_tattoo?: boolean;
}

export interface PricingInfo {
  hourly_rate?: string;
  session_minimum?: string;
  price_range?: string;
  consultation_fee?: string;
  touch_up_policy?: string;
}

export interface ContactInfo {
  booking_url: string;
  email?: string;
  phone?: string;
  booking_platform?: 'website' | 'instagram' | 'email';
  response_time?: string;
}

export interface CrawlStatus {
  last_crawled: string;
  next_crawl_date: string;
  crawl_success: boolean;
  error_message?: string;
  website_status: 'active' | 'inactive' | 'moved';
}

export interface Artist {
  // Core identity
  id: string;
  created_at: string;
  last_updated: string;
  data_source: 'crawled' | 'manual' | 'hybrid';
  
  // Studio relationship
  studio_id?: string | number; // Foreign key to studios table
  
  // Basic info (multilingual)
  name_ja: string;
  name_en: string;
  bio_ja: string;
  bio_en: string;
  location: string;
  address_ja: string;
  address_en: string;
  
  // Portfolio & Pricing (from website)
  website_url?: string;
  portfolio_images: string[];        // High-quality images from website
  image_styles?: ImageStyle[];       // Style information for each image
  image_motifs?: ImageMotif[];       // Motif information for each image
  pricing_info: PricingInfo;
  contact_info: ContactInfo;
  
  // Instagram data (secondary)
  instagram_handle?: string;
  instagram_posts?: string[];        // Recent posts for social proof
  instagram_id?: string;
  
  // Metadata
  style_ids: number[];              // Style IDs from styles table
  view_count: number;
  is_verified: boolean;             // Manually verified by admin
  crawl_status?: CrawlStatus;
  
  // Artist-specific features
  female_artist?: boolean;
  beginner_friendly?: boolean;
  custom_design_allowed?: boolean;
  cover_up_available?: boolean;
  
  // Legacy support (will be migrated)
  images?: string[];                // Old field, use portfolio_images
  price_range?: string;            // Old field, use pricing_info.price_range
  booking_url?: string;            // Old field, use contact_info.booking_url
}

// Combined type for display purposes
export interface ArtistWithStudio extends Artist {
  studio: Studio;
}

export interface Style {
  id: number;
  style_name_ja: string;
  style_name_en: string;
  created_at: string;
  updated_at: string;
}

export interface Motif {
  id: number;
  motif_name_ja: string;
  motif_name_en: string;
  created_at: string;
  updated_at: string;
}

export interface ImageMotif {
  image_url: string;
  motif_ids: number[];
}

export interface ImageStyle {
  image_url: string;
  style_ids: number[];  // Array of style IDs from the styles table
  style_names?: string[]; // Cache of style names for display (optional)
}

export interface StyleTag {
  name: string;
  color: string;
}

export type Database = {
  public: {
    Tables: {
      studios: {
        Row: Studio;
        Insert: Omit<Studio, 'id' | 'created_at' | 'view_count'>;
        Update: Partial<Omit<Studio, 'id' | 'created_at'>>;
      };
      artists: {
        Row: Artist;
        Insert: Omit<Artist, 'id' | 'created_at' | 'view_count'>;
        Update: Partial<Omit<Artist, 'id' | 'created_at'>>;
      };
      styles: {
        Row: Style;
        Insert: Omit<Style, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Style, 'id' | 'created_at' | 'updated_at'>>;
      };
      artist_styles: {
        Row: {
          artist_id: string;
          style_id: number;
          created_at: string;
        };
        Insert: {
          artist_id: string;
          style_id: number;
        };
        Update: Partial<{
          artist_id: string;
          style_id: number;
        }>;
      };
    };
  };
};