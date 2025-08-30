import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

// Dynamic sitemap generator with artist and blog URLs
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.ink-finder.com'
  
  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables')
    // Return static sitemap if Supabase is not configured
    return getStaticSitemap(baseUrl)
  }

  let supabase
  try {
    supabase = createClient(supabaseUrl, supabaseKey)
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    return getStaticSitemap(baseUrl)
  }
  
  // Static pages with multilingual support
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
      alternates: {
        languages: {
          'en-US': baseUrl,
          'ja-JP': `${baseUrl}/ja`,
        },
      },
    },
    {
      url: `${baseUrl}/artists`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: {
        languages: {
          'en-US': `${baseUrl}/artists`,
          'ja-JP': `${baseUrl}/ja/artists`,
        },
      },
    },
    {
      url: `${baseUrl}/styles`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {
        languages: {
          'en-US': `${baseUrl}/styles`,
          'ja-JP': `${baseUrl}/ja/styles`,
        },
      },
    },
    {
      url: `${baseUrl}/locations`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {
        languages: {
          'en-US': `${baseUrl}/locations`,
          'ja-JP': `${baseUrl}/ja/locations`,
        },
      },
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
      alternates: {
        languages: {
          'en-US': `${baseUrl}/about`,
          'ja-JP': `${baseUrl}/ja/about`,
        },
      },
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
      alternates: {
        languages: {
          'en-US': `${baseUrl}/contact`,
          'ja-JP': `${baseUrl}/ja/contact`,
        },
      },
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: {
        languages: {
          'en-US': `${baseUrl}/blog`,
          'ja-JP': `${baseUrl}/ja/blog`,
        },
      },
    },
  ]
  
  // Fetch dynamic artist pages with error handling
  let artistPages: MetadataRoute.Sitemap = []
  try {
    const { data: artists, error } = await supabase
      .from('artists')
      .select('slug, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching artists for sitemap:', error)
    } else {
      artistPages = artists?.map(artist => ({
        url: `${baseUrl}/artists/${artist.slug}`,
        lastModified: new Date(artist.updated_at || new Date()),
        changeFrequency: 'weekly',
        priority: 0.7,
        alternates: {
          languages: {
            'en-US': `${baseUrl}/artists/${artist.slug}`,
            'ja-JP': `${baseUrl}/ja/artists/${artist.slug}`,
          },
        },
      })) || []
    }
  } catch (error) {
    console.error('Failed to fetch artists for sitemap:', error)
  }
  
  // Fetch blog posts (if you have a blog table)
  // Uncomment when blog posts are implemented
  /*
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at')
    .eq('published', true)
    .order('updated_at', { ascending: false })
  
  const blogPages: MetadataRoute.Sitemap = posts?.map(post => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at || new Date()),
    changeFrequency: 'monthly',
    priority: 0.6,
    alternates: {
      languages: {
        'en-US': `${baseUrl}/blog/${post.slug}`,
        'ja-JP': `${baseUrl}/ja/blog/${post.slug}`,
      },
    },
  })) || []
  */
  
  // Popular style pages for SEO
  const stylePages: MetadataRoute.Sitemap = [
    'japanese-traditional',
    'blackwork',
    'realism',
    'neo-traditional',
    'watercolor',
    'geometric',
    'minimalist',
    'tribal'
  ].map(style => ({
    url: `${baseUrl}/styles/${style}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
    alternates: {
      languages: {
        'en-US': `${baseUrl}/styles/${style}`,
        'ja-JP': `${baseUrl}/ja/styles/${style}`,
      },
    },
  }))
  
  // Major city pages for local SEO
  const cityPages: MetadataRoute.Sitemap = [
    'tokyo',
    'osaka',
    'kyoto',
    'yokohama',
    'nagoya',
    'sapporo',
    'fukuoka',
    'kobe'
  ].map(city => ({
    url: `${baseUrl}/locations/${city}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
    alternates: {
      languages: {
        'en-US': `${baseUrl}/locations/${city}`,
        'ja-JP': `${baseUrl}/ja/locations/${city}`,
      },
    },
  }))
  
  return [
    ...staticPages,
    ...artistPages,
    ...stylePages,
    ...cityPages,
    // ...blogPages // Uncomment when blog is ready
  ]
}

// Fallback static sitemap when Supabase is unavailable
function getStaticSitemap(baseUrl: string): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
      alternates: {
        languages: {
          'en-US': baseUrl,
          'ja-JP': `${baseUrl}/ja`,
        },
      },
    },
    {
      url: `${baseUrl}/artists`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: {
        languages: {
          'en-US': `${baseUrl}/artists`,
          'ja-JP': `${baseUrl}/ja/artists`,
        },
      },
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: {
        languages: {
          'en-US': `${baseUrl}/blog`,
          'ja-JP': `${baseUrl}/ja/blog`,
        },
      },
    },
  ]

  // Popular style pages for SEO
  const stylePages: MetadataRoute.Sitemap = [
    'japanese-traditional',
    'blackwork',
    'realism',
    'neo-traditional',
    'watercolor',
    'geometric',
    'minimalist',
    'tribal'
  ].map(style => ({
    url: `${baseUrl}/styles/${style}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
    alternates: {
      languages: {
        'en-US': `${baseUrl}/styles/${style}`,
        'ja-JP': `${baseUrl}/ja/styles/${style}`,
      },
    },
  }))

  // Major city pages for local SEO
  const cityPages: MetadataRoute.Sitemap = [
    'tokyo',
    'osaka',
    'kyoto',
    'yokohama',
    'nagoya',
    'sapporo',
    'fukuoka',
    'kobe'
  ].map(city => ({
    url: `${baseUrl}/locations/${city}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
    alternates: {
      languages: {
        'en-US': `${baseUrl}/locations/${city}`,
        'ja-JP': `${baseUrl}/ja/locations/${city}`,
      },
    },
  }))

  return [
    ...staticPages,
    ...stylePages,
    ...cityPages,
  ]
}