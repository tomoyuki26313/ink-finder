'use client'

import { useState, useEffect } from 'react'
import { Play, Pause, RefreshCw, AlertCircle, CheckCircle, Clock, Globe, Database, BarChart3 } from 'lucide-react'
import { Artist, Studio } from '@/types/database'
import { CrawlProgress } from '@/lib/crawler'

interface CrawlStats {
  totalStudios: number
  totalArtists: number
  crawledStudios: number
  crawledArtists: number
  pendingReview: number
  lastCrawl: string
  nextCrawl: string
  crawlStatus: 'idle' | 'running' | 'error' | 'stopping'
  errors: { url: string; error: string; timestamp: string }[]
}

interface CrawlDashboardProps {
  onStartCrawl: () => Promise<void>
  onStopCrawl: () => void
  onRunMonthlyCrawl: () => Promise<void>
  stats: CrawlStats
  currentProgress?: CrawlProgress | null
}

export default function CrawlDashboard({ 
  onStartCrawl, 
  onStopCrawl, 
  onRunMonthlyCrawl, 
  stats, 
  currentProgress 
}: CrawlDashboardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isMonthlyCrawlLoading, setIsMonthlyCrawlLoading] = useState(false)

  const handleStartCrawl = async () => {
    setIsLoading(true)
    try {
      await onStartCrawl()
    } finally {
      setIsLoading(false)
    }
  }

  const handleMonthlyCrawl = async () => {
    setIsMonthlyCrawlLoading(true)
    try {
      await onRunMonthlyCrawl()
    } finally {
      setIsMonthlyCrawlLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-blue-600 bg-blue-100'
      case 'stopping': return 'text-orange-600 bg-orange-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-green-600 bg-green-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <RefreshCw className="w-4 h-4 animate-spin" />
      case 'stopping': return <Pause className="w-4 h-4" />
      case 'error': return <AlertCircle className="w-4 h-4" />
      default: return <CheckCircle className="w-4 h-4" />
    }
  }

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.ceil(ms / 60000)
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Studio Crawl Dashboard</h2>
          <p className="text-gray-600">Monitor and manage tattoo studio website crawling operations</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(stats.crawlStatus)}`}>
            {getStatusIcon(stats.crawlStatus)}
            <span className="capitalize">{stats.crawlStatus}</span>
          </div>
          
          {stats.crawlStatus === 'running' || stats.crawlStatus === 'stopping' ? (
            <button
              onClick={onStopCrawl}
              disabled={stats.crawlStatus === 'stopping'}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <Pause className="w-4 h-4" />
              {stats.crawlStatus === 'stopping' ? 'Stopping...' : 'Stop Crawl'}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleStartCrawl}
                disabled={isLoading}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Start Studio Crawl
              </button>
              
              <button
                onClick={handleMonthlyCrawl}
                disabled={isMonthlyCrawlLoading}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isMonthlyCrawlLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <BarChart3 className="w-4 h-4" />
                )}
                Monthly Studio Crawl
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Progress Bar */}
      {currentProgress && currentProgress.status === 'running' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Studio Crawl Progress</h3>
              <p className="text-sm text-gray-600">
                Processing: {currentProgress.currentUrl || 'Discovering studio URLs...'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {currentProgress.processedUrls}/{currentProgress.totalUrls}
              </div>
              <div className="text-sm text-gray-700">
                {currentProgress.estimatedTimeRemaining ? 
                  `~${formatTimeRemaining(currentProgress.estimatedTimeRemaining)} remaining` : 
                  'Calculating...'
                }
              </div>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
              style={{ 
                width: `${currentProgress.totalUrls > 0 ? (currentProgress.processedUrls / currentProgress.totalUrls) * 100 : 0}%` 
              }}
            />
          </div>
          
          <div className="grid grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-green-600">{currentProgress.successfulCrawls}</div>
              <div className="text-xs text-gray-700">Successful</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-red-600">{currentProgress.failedCrawls}</div>
              <div className="text-xs text-gray-700">Failed</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-purple-600">{currentProgress.studiosFound || 0}</div>
              <div className="text-xs text-gray-700">Studios Found</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-indigo-600">{currentProgress.artistsFound || 0}</div>
              <div className="text-xs text-gray-700">Artists Found</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">
                {Math.round((currentProgress.processedUrls / Math.max(currentProgress.totalUrls || 1, 1)) * 100)}%
              </div>
              <div className="text-xs text-gray-700">Complete</div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Studios</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudios || 0}</p>
            </div>
            <Database className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Artists</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalArtists}</p>
            </div>
            <Database className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Crawled Studios</p>
              <p className="text-2xl font-bold text-gray-900">
                {currentProgress ? currentProgress.studiosFound || 0 : stats.crawledStudios || 0}
              </p>
              {currentProgress && currentProgress.studiosFound && (
                <p className="text-xs text-green-600">+{currentProgress.studiosFound} this session</p>
              )}
            </div>
            <Globe className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Crawled Artists</p>
              <p className="text-2xl font-bold text-gray-900">
                {currentProgress ? currentProgress.artistsFound || 0 : stats.crawledArtists}
              </p>
              {currentProgress && currentProgress.artistsFound && (
                <p className="text-xs text-green-600">+{currentProgress.artistsFound} this session</p>
              )}
            </div>
            <Globe className="w-8 h-8 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Next Crawl</p>
              <p className="text-sm font-bold text-gray-900">
                {new Date(stats.nextCrawl).toLocaleDateString()}
              </p>
            </div>
            <Clock className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Crawl Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Last Successful Studio Crawl</p>
                <p className="text-sm text-gray-600">
                  {new Date(stats.lastCrawl).toLocaleString()}
                </p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Next Scheduled Studio Crawl</p>
                <p className="text-sm text-gray-600">
                  {new Date(stats.nextCrawl).toLocaleString()}
                </p>
              </div>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Error Log */}
      {stats.errors.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Errors</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {stats.errors.slice(0, 5).map((error, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-900">{error.url}</p>
                    <p className="text-sm text-red-700">{error.error}</p>
                    <p className="text-xs text-red-600 mt-1">
                      {new Date(error.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Crawl Configuration */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Crawl Configuration</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Crawl Frequency
              </label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="monthly">Monthly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Request Delay (ms)
              </label>
              <input
                type="number"
                defaultValue={1000}
                min={500}
                max={5000}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Max Concurrent Requests
              </label>
              <input
                type="number"
                defaultValue={3}
                min={1}
                max={10}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Timeout (seconds)
              </label>
              <input
                type="number"
                defaultValue={10}
                min={5}
                max={30}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}