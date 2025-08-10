# Google Analytics 4 Setup Guide for Ink Finder

This guide provides comprehensive instructions for implementing Google Analytics 4 (GA4) in your Next.js application with full GDPR compliance and language-specific tracking.

## Table of Contents

1. [Quick Setup](#quick-setup)
2. [Google Analytics 4 Configuration](#google-analytics-4-configuration)
3. [Implementation Details](#implementation-details)
4. [Language-Specific Tracking](#language-specific-tracking)
5. [GDPR Compliance](#gdpr-compliance)
6. [Custom Events](#custom-events)
7. [Testing](#testing)
8. [Best Practices](#best-practices)

## Quick Setup

### 1. Create Google Analytics 4 Property

1. Go to [Google Analytics](https://analytics.google.com)
2. Click "Start measuring" or create a new property
3. Choose "Web" as the platform
4. Enter your website details:
   - Website name: "Ink Finder"
   - Website URL: "https://ink-finder.com"
   - Industry: "Arts & Entertainment"
   - Reporting time zone: "Asia/Tokyo" (or your preference)
5. Copy your Measurement ID (format: G-XXXXXXXXXX)

### 2. Environment Configuration

Create or update your `.env.local` file:

```bash
# Google Analytics 4 Configuration
NEXT_PUBLIC_GA_TRACKING_ID=G-YOUR-MEASUREMENT-ID

# Optional: Enable analytics in development
NEXT_PUBLIC_ENABLE_ANALYTICS_IN_DEV=false
```

### 3. Verify Installation

The analytics are already integrated into your application through the root layout. After setting your GA4 ID:

1. Start your development server: `npm run dev`
2. Open your browser's developer tools
3. Navigate to your site
4. Check the Network tab for requests to `googletagmanager.com`
5. Check the Console for any GA-related messages

## Google Analytics 4 Configuration

### Recommended GA4 Settings

In your Google Analytics dashboard, configure these settings:

#### Enhanced Measurement
Enable these automatic tracking features:
- [x] Page views ✓ (Already implemented)
- [x] Scrolls ✓ (Custom implementation)
- [x] Outbound clicks ✓ (Custom implementation)
- [x] Site search ✓ (Custom implementation)
- [x] Video engagement (if you add videos)
- [x] File downloads (if applicable)

#### Custom Dimensions

Create these custom dimensions in GA4 (Admin > Custom definitions > Custom dimensions):

| Dimension Name | Parameter Name | Scope | Description |
|----------------|----------------|--------|-------------|
| Language | language | Event | Track EN/JA usage |
| Content Group | content_group1 | Event | English/Japanese content |
| Artist ID | artist_id | Event | Track specific artist views |
| Search Type | search_type | Event | Track search categories |
| Page Type | page_type | Event | Track page categories |

#### Conversion Events

Mark these events as conversions in GA4 (Admin > Conversions):
- `artist_booking` - When users click booking buttons
- `form_submit_success` - Successful form submissions
- `contact_click` - When users contact artists
- `language_switch` - Language switching (for engagement tracking)

## Implementation Details

### Analytics Component Structure

The implementation consists of several key components:

```
src/lib/analytics.ts              # Core GA4 utilities
src/components/Analytics.tsx      # Main analytics component with GDPR
src/hooks/useAnalytics.ts        # Basic tracking hooks
src/hooks/useCustomEvents.ts     # Advanced event tracking
src/lib/languageAnalytics.ts     # Language-specific tracking
```

### Automatic Tracking

The following events are automatically tracked:

- **Page Views**: All page navigation with language context
- **Scroll Depth**: 25%, 50%, 75%, 90%, 100% milestones
- **Time on Page**: Session duration and engagement
- **Language Switches**: Automatic detection and tracking
- **Error Events**: JavaScript errors and API failures

## Language-Specific Tracking

### Automatic Language Detection

The system automatically tracks:
- User's preferred language (browser, cookie, URL)
- Language switch patterns and frequency
- Content engagement by language
- Search behavior differences between EN/JA users

### Custom Language Events

```typescript
import { useLanguageAnalytics } from '@/hooks/useCustomEvents'

// Track language-specific search
const { trackSearch } = useSearchTracking()
trackSearch('traditional tattoo', 15) // Automatically includes language context

// Track cross-language user journeys
const { trackLanguageSwitch } = useLanguageSwitchTracking()
trackLanguageSwitch('en', 'ja', 'toggle')
```

### Language Reporting

In GA4, create custom reports to analyze:
- Page views by language (content_group1 dimension)
- Conversion rates by language
- User flow between language versions
- Search query differences by language

## GDPR Compliance

### Consent Management

The implementation includes a GDPR-compliant consent banner that:
- Appears only for first-time visitors
- Provides clear opt-in/opt-out choices
- Stores consent preferences in cookies
- Allows users to change preferences later

### Privacy Settings Component

```typescript
import { PrivacySettings } from '@/components/Analytics'

// Add to your privacy/settings page
<PrivacySettings />
```

### Data Handling

The analytics implementation:
- ✅ Anonymizes IP addresses automatically
- ✅ Disables Google Signals by default
- ✅ Respects user consent choices
- ✅ Provides data retention controls
- ✅ Allows consent withdrawal

### Required Privacy Policy Updates

Add this section to your privacy policy:

> **Analytics and Tracking**
> 
> We use Google Analytics to understand how visitors use our website. Google Analytics collects information anonymously and reports website usage statistics without identifying individual visitors.
> 
> The information collected includes:
> - Pages visited and time spent on site
> - Geographic location (country/city level)
> - Device and browser information
> - Referral sources
> 
> You can opt-out of Google Analytics tracking through our cookie consent banner or privacy settings page.

## Custom Events

### Artist Interactions

```typescript
import { useArtistTracking } from '@/hooks/useCustomEvents'

const { trackArtistView, trackArtistBooking } = useArtistTracking()

// Track when users view an artist
trackArtistView('artist-123', 'Taro Yamada', 'search_results')

// Track booking attempts
trackArtistBooking('artist-123', 'Taro Yamada', 'website')
```

### Search and Filters

```typescript
import { useSearchTracking } from '@/hooks/useCustomEvents'

const { trackSearch, trackFilter } = useSearchTracking()

// Track search queries
trackSearch('dragon tattoo', 8, 'style_search')

// Track filter usage
trackFilter('style', 'japanese', 12)
```

### Form Interactions

```typescript
import { useFormTracking } from '@/hooks/useAnalytics'

const { trackFormStart, trackFormSubmit } = useFormTracking('contact_form')

// Track form engagement
const handleFormStart = () => trackFormStart()
const handleSubmit = (success: boolean) => trackFormSubmit(success)
```

## Testing

### Development Testing

1. Set `NEXT_PUBLIC_ENABLE_ANALYTICS_IN_DEV=true` in `.env.local`
2. Use Google Analytics DebugView:
   - Go to GA4 Admin > DebugView
   - Enable debug mode in browser console: `gtag('config', 'GA_MEASUREMENT_ID', { debug_mode: true })`
3. Monitor real-time events in GA4 Real-time reports

### Production Testing

1. Deploy with your GA4 measurement ID
2. Test the consent banner functionality
3. Verify events appear in GA4 Real-time reports
4. Test language switching and tracking
5. Check error tracking by intentionally causing errors

### Testing Checklist

- [ ] Page views tracked correctly
- [ ] Language switching events recorded
- [ ] Artist interaction events firing
- [ ] Search events with proper metadata
- [ ] Consent banner appears for new users
- [ ] Privacy settings allow consent changes
- [ ] Scroll depth tracking works
- [ ] Form submission tracking active
- [ ] Error events captured
- [ ] Performance metrics recorded

## Best Practices

### Performance Optimization

1. **Load Strategy**: Scripts use `strategy="afterInteractive"` to not block page rendering
2. **Consent-First**: GA4 only loads after user consent
3. **Minimal Data**: Only collect necessary analytics data
4. **Efficient Tracking**: Batch similar events when possible

### Data Quality

1. **Consistent Naming**: Use clear, consistent event and parameter names
2. **Meaningful Labels**: Include context in event labels
3. **Value Tracking**: Add numeric values where applicable
4. **Error Handling**: Track errors gracefully without breaking user experience

### Privacy Best Practices

1. **Minimal Collection**: Only track what you need for business decisions
2. **User Control**: Always provide opt-out mechanisms
3. **Transparent Communication**: Clearly explain what data is collected
4. **Regular Audits**: Review tracking implementation periodically
5. **Consent Documentation**: Keep records of user consent choices

### Reporting and Analysis

1. **Custom Dashboards**: Create GA4 dashboards for key metrics
2. **Regular Review**: Weekly/monthly analytics review
3. **Language Comparison**: Compare performance across languages
4. **User Journey Analysis**: Track paths through your site
5. **Conversion Tracking**: Monitor booking and contact conversions

## Troubleshooting

### Common Issues

**Events not appearing in GA4:**
- Check that `NEXT_PUBLIC_GA_TRACKING_ID` is set correctly
- Verify user has given analytics consent
- Check browser's network tab for GA requests
- Use GA4 DebugView for real-time validation

**Consent banner not showing:**
- Clear cookies and localStorage
- Check if `analytics_banner_seen=true` cookie exists
- Verify component is properly wrapped in Analytics component

**Language tracking not working:**
- Confirm LanguageContext is providing correct language values
- Check that language parameter is included in events
- Verify custom dimensions are set up in GA4

### Debug Commands

```typescript
// Check analytics consent status
console.log('Analytics consent:', hasAnalyticsConsent())

// Manual event tracking test
trackEvent({
  action: 'test_event',
  category: 'Debug',
  label: 'Manual test',
  language: 'en'
})

// Check current language
console.log('Current language:', useLanguage().language)
```

This implementation provides enterprise-level analytics tracking with full GDPR compliance and comprehensive language-specific insights for your Japanese tattoo artist directory.