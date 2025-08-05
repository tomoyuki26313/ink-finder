# Hybrid Data Architecture: Instagram + Website Crawling

## Data Sources & Strategy

### 1. Data Sources
- **Primary**: Website crawling (portfolio, pricing, bio, contact)
- **Secondary**: Instagram (social presence, recent posts)
- **Manual**: Admin-added artists via CSV import

### 2. Database Schema

```typescript
interface Artist {
  // Core identity
  id: string
  created_at: string
  last_updated: string
  data_source: 'crawled' | 'manual' | 'hybrid'
  
  // Basic info (multilingual)
  name_ja: string
  name_en: string
  bio_ja: string
  bio_en: string
  location: string
  address_ja: string
  address_en: string
  
  // Portfolio & Pricing (from website)
  website_url?: string
  portfolio_images: string[]        // High-quality images from website
  pricing_info: PricingInfo
  contact_info: ContactInfo
  
  // Instagram data (secondary)
  instagram_handle?: string
  instagram_posts?: string[]        // Recent posts for social proof
  
  // Metadata
  styles: string[]
  view_count: number
  is_verified: boolean             // Manually verified by admin
  crawl_status: CrawlStatus
}

interface PricingInfo {
  hourly_rate?: string
  session_minimum?: string
  price_range?: string
  consultation_fee?: string
  touch_up_policy?: string
}

interface ContactInfo {
  booking_url: string
  email?: string
  phone?: string
  booking_platform?: string       // "website" | "instagram" | "email"
  response_time?: string
}

interface CrawlStatus {
  last_crawled: string
  next_crawl_date: string
  crawl_success: boolean
  error_message?: string
  website_status: 'active' | 'inactive' | 'moved'
}
```

### 3. Crawling System

#### Monthly Automation:
1. **Discovery Phase**: Crawl tattoo directories for new artists
2. **Website Crawling**: Extract portfolio, pricing, contact info
3. **Instagram Sync**: Update social media data
4. **Data Validation**: Check for duplicates, validate info
5. **Admin Review**: New artists flagged for review

#### Directory Sites to Target:
- Japanese tattoo studio directories
- Regional artist listings
- Professional tattoo associations
- Studio websites with artist pages

### 4. Admin UI Enhancements

#### New Admin Sections:
- **Crawl Dashboard**: Monitor crawling status, errors
- **Artist Review**: Approve/edit newly discovered artists
- **Data Sources**: Manage which sites to crawl
- **Crawl Schedule**: Configure automation settings

#### Enhanced Artist Management:
- **Data Source Indicators**: Show if data is from crawling, manual, or hybrid
- **Sync Status**: When each data source was last updated
- **Quality Scores**: Rate data completeness and accuracy
- **Bulk Operations**: Approve multiple new artists at once

### 5. Implementation Plan

#### Phase 1: Data Structure
- Update database schema
- Create crawling infrastructure
- Build data validation system

#### Phase 2: Crawling System
- Implement website scrapers
- Add Instagram integration
- Create duplicate detection
- Build error handling

#### Phase 3: Admin UI
- Enhanced artist management
- Crawl monitoring dashboard
- Bulk approval workflows
- Data quality indicators

#### Phase 4: Automation
- Monthly crawl scheduling
- Auto-discovery of new artists
- Email notifications for admin review
- Performance monitoring

### 6. Data Flow

```
Directory Sites → New Artist Discovery
     ↓
Artist Websites → Portfolio + Pricing + Contact
     ↓
Instagram API → Social Media Data
     ↓
Data Validation → Duplicate Check + Quality Score
     ↓
Admin Review → Approve/Edit/Reject
     ↓
Live Database → User-facing search
```

### 7. Benefits

- **Richer Data**: Complete artist profiles with pricing and portfolios
- **Current Information**: Monthly updates keep data fresh
- **Scalable Growth**: Automatic discovery of new artists
- **Quality Control**: Admin review ensures accuracy
- **Multi-source**: Best of both website and social media data