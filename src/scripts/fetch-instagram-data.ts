// Script to fetch Instagram data for tattoo artists
// Run with: npx tsx src/scripts/fetch-instagram-data.ts

import { InstagramAPI, TattooArtistInstagramData } from '../lib/instagram-api';
import { japaneseTattooArtists, getInstagramProfileUrl } from '../data/japanese-tattoo-artists';

// Note: You need to set up Instagram Basic Display API and get access tokens
// For now, this shows the structure of how to fetch data

async function fetchArtistInstagramData(accessToken: string, minFollowers: number = 500) {
  const api = new InstagramAPI(accessToken, minFollowers);
  const artistsData: TattooArtistInstagramData[] = [];
  const rejectedArtists: Array<{ artist: any; reason: string }> = [];

  console.log(`🔍 Filtering artists with minimum ${minFollowers} followers...\n`);

  for (const artist of japaneseTattooArtists) {
    try {
      console.log(`Checking ${artist.name_en} (@${artist.instagram_handle})...`);
      
      // Check if artist meets minimum follower criteria
      const eligibility = await api.checkUserEligibility(artist.instagram_handle.replace('@', ''));
      
      if (!eligibility.eligible) {
        console.log(`❌ Rejected: ${artist.name_en} - ${eligibility.reason}`);
        rejectedArtists.push({ artist, reason: eligibility.reason });
        continue;
      }

      console.log(`✅ Approved: ${artist.name_en} - ${eligibility.profile?.followers_count || 'N/A'} followers`);
      
      const artistData: TattooArtistInstagramData = {
        instagram_id: eligibility.profile?.id || '',
        instagram_handle: artist.instagram_handle,
        profile_url: getInstagramProfileUrl(artist.instagram_handle),
        media_posts: [] // Would be populated with actual posts
      };
      
      artistsData.push(artistData);
      
    } catch (error) {
      console.error(`Error checking ${artist.instagram_handle}:`, error);
      rejectedArtists.push({ artist, reason: `API Error: ${error.message}` });
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`✅ Approved: ${artistsData.length} artists`);
  console.log(`❌ Rejected: ${rejectedArtists.length} artists\n`);

  if (rejectedArtists.length > 0) {
    console.log(`Rejected Artists:`);
    rejectedArtists.forEach(({ artist, reason }) => {
      console.log(`- ${artist.name_en} (@${artist.instagram_handle}): ${reason}`);
    });
  }

  return { approved: artistsData, rejected: rejectedArtists };
}

// Alternative approach: Generate a template for manual data collection
function generateDataCollectionTemplate() {
  console.log('Instagram Data Collection Template for Japanese Tattoo Artists\n');
  console.log('='.repeat(60));
  
  japaneseTattooArtists.forEach((artist, index) => {
    console.log(`\n${index + 1}. ${artist.name_en} (${artist.name_ja})`);
    console.log(`   Instagram: @${artist.instagram_handle}`);
    console.log(`   Profile URL: ${getInstagramProfileUrl(artist.instagram_handle)}`);
    console.log(`   Location: ${artist.location}`);
    console.log(`   Styles: ${artist.styles.join(', ')}`);
    console.log(`   Studio: ${artist.studio || 'N/A'}`);
    console.log(`   Sample Posts: `);
    console.log(`   - [Post 1 URL]`);
    console.log(`   - [Post 2 URL]`);
    console.log(`   - [Post 3 URL]`);
  });
}

// Manual data structure for artists (can be populated manually)
export const artistInstagramData = [
  {
    id: "artist-001",
    name_ja: "ホリトモ",
    name_en: "Horitomo",
    instagram_handle: "horitomo_stateofgrace",
    instagram_id: "1234567890", // Would be actual Instagram user ID
    profile_url: "https://www.instagram.com/horitomo_stateofgrace/",
    follower_count: 50000, // Approximate
    media_count: 1500, // Approximate
    sample_posts: [
      {
        url: "https://www.instagram.com/p/SAMPLE1/",
        type: "image",
        caption: "Traditional Japanese tattoo work"
      },
      {
        url: "https://www.instagram.com/p/SAMPLE2/",
        type: "image",
        caption: "Dragon sleeve in progress"
      },
      {
        url: "https://www.instagram.com/p/SAMPLE3/",
        type: "image",
        caption: "Koi fish design"
      }
    ]
  }
  // Add more artists here...
];

// Run the template generator
if (require.main === module) {
  generateDataCollectionTemplate();
  
  console.log('\n\nNote: To use Instagram Basic Display API:');
  console.log('1. Register as a Facebook Developer');
  console.log('2. Create an Instagram Basic Display app');
  console.log('3. Get user authorization and access tokens');
  console.log('4. Use the API to fetch your own Instagram data');
  console.log('\nFor other users\' data, you need their explicit permission.');
}