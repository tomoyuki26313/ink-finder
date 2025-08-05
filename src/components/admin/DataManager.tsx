'use client'

import { useState } from 'react'
import { Download, Upload, FileText } from 'lucide-react'
import { Artist } from '@/types/database'

interface DataManagerProps {
  artists: Artist[]
  onImportArtists: (artists: Artist[]) => void
}

export default function DataManager({ artists, onImportArtists }: DataManagerProps) {
  const [importData, setImportData] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [importFormat, setImportFormat] = useState<'json' | 'csv'>('csv')

  const exportData = () => {
    const dataStr = JSON.stringify(artists, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ink-finder-artists-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exportCSV = () => {
    const headers = ['name_ja', 'name_en', 'bio_ja', 'bio_en', 'location', 'address_ja', 'address_en', 'styles', 'price_range', 'booking_url', 'instagram_handle', 'images', 'female_artist', 'beginner_friendly', 'custom_design_allowed', 'cover_up_available']
    
    const csvRows = [headers.join(',')]
    
    artists.forEach(artist => {
      const row = headers.map(header => {
        const value = artist[header as keyof Artist]
        
        if (Array.isArray(value)) {
          return `"${value.join(';')}"`
        } else if (typeof value === 'boolean') {
          return value.toString()
        } else if (value === null || value === undefined) {
          return ''
        } else {
          // Escape quotes and wrap in quotes if contains comma
          const strValue = value.toString()
          return strValue.includes(',') || strValue.includes('"') 
            ? `"${strValue.replace(/"/g, '""')}"` 
            : strValue
        }
      })
      
      csvRows.push(row.join(','))
    })
    
    const csvStr = csvRows.join('\n')
    const dataBlob = new Blob([csvStr], { type: 'text/csv' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ink-finder-artists-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const parseCSV = (csvData: string): Artist[] => {
    const lines = csvData.trim().split('\n')
    if (lines.length < 2) throw new Error('CSV must have headers and at least one data row')
    
    const headers = lines[0].split(',').map(h => h.trim())
    const artists: Artist[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || []
      const cleanValues = values.map(v => v.replace(/^"|"$/g, '').trim())
      
      if (cleanValues.length === 0) continue
      
      const artist: any = {
        id: `artist-${Date.now()}-${i}`,
        created_at: new Date().toISOString(),
        view_count: 0
      }
      
      headers.forEach((header, index) => {
        const value = cleanValues[index] || ''
        
        // Handle array fields (styles, images)
        if (header === 'styles' || header === 'images') {
          artist[header] = value ? value.split(';').map(s => s.trim()).filter(Boolean) : []
        }
        // Handle boolean fields
        else if (['female_artist', 'beginner_friendly', 'custom_design_allowed', 'cover_up_available'].includes(header)) {
          artist[header] = value.toLowerCase() === 'true' || value === '1'
        }
        // Handle other fields
        else {
          artist[header] = value
        }
      })
      
      // Validate required multilingual fields
      if (!artist.name_ja && !artist.name_en) {
        throw new Error(`Row ${i}: At least one name field (name_ja or name_en) is required`)
      }
      
      artists.push(artist as Artist)
    }
    
    return artists
  }

  const handleImport = () => {
    try {
      let parsedData: Artist[]
      
      if (importFormat === 'csv') {
        parsedData = parseCSV(importData)
      } else {
        parsedData = JSON.parse(importData)
        if (!Array.isArray(parsedData)) {
          throw new Error('JSON must be an array of artists')
        }
      }
      
      // Merge with existing artists instead of replacing
      const existingArtists = artists
      const mergedArtists = [...existingArtists, ...parsedData]
      
      onImportArtists(mergedArtists)
      setImportData('')
      setShowImport(false)
      alert(`Successfully added ${parsedData.length} new artists! Total: ${mergedArtists.length} artists.`)
    } catch (error: any) {
      alert(`Import error: ${error.message}`)
    }
  }

  const loadRealisticArtists = async () => {
    if (confirm('This will load realistic Japanese tattoo artists (500+ followers) and replace current data. Continue?')) {
      try {
        // Import the realistic artists data
        const { realisticArtists } = await import('@/data/realistic-artists')
        
        onImportArtists(realisticArtists)
        alert(`Successfully loaded ${realisticArtists.length} realistic Japanese tattoo artists with 500+ Instagram followers!`)
      } catch (error) {
        alert('Error loading realistic artists data')
        console.error(error)
      }
    }
  }

  const downloadSampleCSV = () => {
    const sampleCSV = `name_ja,name_en,bio_ja,bio_en,location,address_ja,address_en,styles,price_range,booking_url,instagram_handle,images,female_artist,beginner_friendly,custom_design_allowed,cover_up_available
"田中ゆき","Yuki Tanaka","伝統的な和彫りを専門とし、龍と鯉の作品で有名","Traditional Japanese tattoo artist specializing in dragons and koi fish",東京都,"渋谷区","Shibuya, Tokyo","和彫り;ドラゴン;鯉",¥30000-¥150000,https://example.com/booking,@yukitattoo,"https://www.instagram.com/p/sample1/;https://www.instagram.com/p/sample2/",true,false,true,true
"山本健二","Kenji Yamamoto","伝統と現代を融合させたモダンなタトゥーアーティスト","Modern tattoo artist mixing traditional Japanese and contemporary Western styles",大阪府,"難波","Namba, Osaka","ネオジャパニーズ;ブラックワーク",¥20000-¥100000,https://example.com/kenji,@kenji_ink,https://www.instagram.com/p/sample3/,false,true,true,false
"伊藤さくら","Sakura Ito","ファインラインとミニマルデザインの専門家","Fine line and minimalist tattoo specialist. Creates delicate botanical designs",京都府,"祇園","Gion, Kyoto","ファインライン;ミニマル;ボタニカル",¥15000-¥80000,https://sakuraink.com,@sakura_fineline,"https://www.instagram.com/p/sample4/;https://www.instagram.com/p/sample5/",true,true,false,false`

    const blob = new Blob([sampleCSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'ink-finder-sample-import.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const generateSampleData = () => {
    const sampleArtist = {
      id: `sample-${Date.now()}`,
      name_ja: 'サンプル太郎',
      name_en: 'Sample Taro',
      bio_ja: 'サンプルのアーティスト説明文です。',
      bio_en: 'Sample artist bio description.',
      location: '東京都',
      address_ja: '〒000-0000 東京都サンプル区サンプル町1-1-1',
      address_en: '1-1-1 Sample-cho, Sample-ku, Tokyo 000-0000',
      styles: ['和彫り', 'ブラックワーク'],
      price_range: '¥20,000 - ¥100,000',
      booking_url: 'https://example.com/booking',
      instagram_handle: '@sample_artist',
      instagram_posts: [
        'https://www.instagram.com/p/ABC123/',
        'https://www.instagram.com/p/DEF456/'
      ],
      view_count: 0,
      created_at: new Date().toISOString(),
      speaks_english: true,
      speaks_chinese: false,
      speaks_korean: false,
      has_female_artist: false,
      lgbtq_friendly: true,
      beginner_friendly: true,
      same_day_booking: false,
      private_room: true,
      parking_available: false,
      credit_card_accepted: true,
      digital_payment_accepted: true,
      late_night_hours: false,
      weekend_hours: true,
      custom_design_allowed: true,
      cover_up_available: false,
      jagua_tattoo: false
    }

    setImportData(JSON.stringify([sampleArtist], null, 2))
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
      
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={exportData}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export JSON ({artists.length})
          </button>
          
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV ({artists.length})
          </button>
          
          <button
            onClick={() => setShowImport(!showImport)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import Artists
          </button>

          <button
            onClick={generateSampleData}
            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Generate Sample
          </button>
          
          <button
            onClick={loadRealisticArtists}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Load 60 Realistic Artists
          </button>
        </div>

        {showImport && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-md font-medium text-gray-900 mb-2">Import Artist Data</h4>
            
            <div className="flex gap-4 mb-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={importFormat === 'csv'}
                  onChange={() => setImportFormat('csv')}
                  className="mr-2"
                />
                CSV Format
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={importFormat === 'json'}
                  onChange={() => setImportFormat('json')}
                  className="mr-2"
                />
                JSON Format
              </label>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              {importFormat === 'csv' 
                ? 'Paste CSV data with headers. Arrays should be semicolon-separated (e.g., style1;style2). New artists will be added to existing ones.'
                : 'Paste JSON data containing an array of artists. New artists will be added to existing ones.'
              }
            </p>
            
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder={importFormat === 'csv' ? "name_ja,name_en,bio_ja,bio_en,location,address_ja,address_en,styles,price_range,booking_url,instagram_handle,images,female_artist,beginner_friendly,custom_design_allowed,cover_up_available" : "Paste JSON data here..."}
              rows={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
            
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleImport}
                disabled={!importData.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Import Data
              </button>
              <button
                onClick={() => {
                  setImportData('')
                  setShowImport(false)
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={downloadSampleCSV}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Download Sample CSV File
              </button>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <h4 className="font-medium text-yellow-800 mb-1">Data Persistence</h4>
          <p>
            Currently using browser storage only. For production, connect to a database:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Set up Supabase database</li>
            <li>Replace mock data with real API calls</li>
            <li>Add user authentication for admin access</li>
          </ul>
        </div>
      </div>
    </div>
  )
}