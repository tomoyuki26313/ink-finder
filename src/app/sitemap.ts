import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

// Dynamic sitemap generator with artist and blog URLs
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://inkfinder.jp'
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  // Static pages with multilingual support
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
      alternates: {
        languages: {
          en: baseUrl,
          ja: `${baseUrl}/ja`,
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
          en: `${baseUrl}/artists`,
          ja: `${baseUrl}/ja/artists`,
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
          en: `${baseUrl}/styles`,
          ja: `${baseUrl}/ja/styles`,
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
          en: `${baseUrl}/locations`,
          ja: `${baseUrl}/ja/locations`,
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
          en: `${baseUrl}/about`,
          ja: `${baseUrl}/ja/about`,
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
          en: `${baseUrl}/contact`,
          ja: `${baseUrl}/ja/contact`,
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
          en: `${baseUrl}/blog`,
          ja: `${baseUrl}/ja/blog`,
        },
      },
    },
  ]
  
  // Fetch dynamic artist pages
  const { data: artists } = await supabase
    .from('artists')
    .select('slug, updated_at')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
  
  const artistPages: MetadataRoute.Sitemap = artists?.map(artist => ({
    url: `${baseUrl}/artists/${artist.slug}`,
    lastModified: new Date(artist.updated_at || new Date()),
    changeFrequency: 'weekly',
    priority: 0.7,
    alternates: {
      languages: {
        en: `${baseUrl}/artists/${artist.slug}`,
        ja: `${baseUrl}/ja/artists/${artist.slug}`,
      },
    },
  })) || []
  
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
        en: `${baseUrl}/blog/${post.slug}`,
        ja: `${baseUrl}/ja/blog/${post.slug}`,
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
        en: `${baseUrl}/styles/${style}`,
        ja: `${baseUrl}/ja/styles/${style}`,
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
        en: `${baseUrl}/locations/${city}`,
        ja: `${baseUrl}/ja/locations/${city}`,
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