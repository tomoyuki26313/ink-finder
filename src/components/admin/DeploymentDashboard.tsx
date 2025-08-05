'use client'

import { useState, useEffect } from 'react'
import { Upload, Database, AlertCircle, CheckCircle, Clock, GitBranch } from 'lucide-react'
import { Artist, Studio } from '@/types/database'
import { isSupabaseConfigured } from '@/lib/supabase'

interface DeploymentDashboardProps {
  localArtists: Artist[]
  localStudios: Studio[]
  onSyncToProduction: () => Promise<void>
  onSyncStudiosToProduction?: () => Promise<void>
}

export default function DeploymentDashboard({ 
  localArtists, 
  localStudios, 
  onSyncToProduction 
}: DeploymentDashboardProps) {
  const [productionArtists, setProductionArtists] = useState<Artist[]>([])
  const [productionStudios, setProductionStudios] = useState<Studio[]>([])
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [changes, setChanges] = useState({
    newArtists: 0,
    modifiedArtists: 0,
    newStudios: 0,
    modifiedStudios: 0
  })

  useEffect(() => {
    loadProductionData()
    calculateChanges()
  }, [localArtists, localStudios])

  const loadProductionData = async () => {
    if (!isSupabaseConfigured) return
    
    try {
      // Load production data from Supabase
      const { fetchArtists } = await import('@/lib/api')
      const prodArtists = await fetchArtists()
      console.log(`🔄 Loaded ${prodArtists.length} artists from production`)
      setProductionArtists(prodArtists)
      
      // For now, studios are only local
      setProductionStudios([])
      
      // Recalculate changes after loading new data
      return prodArtists
    } catch (error) {
      console.error('Failed to load production data:', error)
      return []
    }
  }

  const calculateChanges = () => {
    const productionArtistIds = new Set(productionArtists.map(a => a.id))
    const productionStudioIds = new Set(productionStudios.map(s => s.id))

    const newArtists = localArtists.filter(a => !productionArtistIds.has(a.id)).length
    const modifiedArtists = localArtists.filter(a => {
      if (!productionArtistIds.has(a.id)) return false
      const prodArtist = productionArtists.find(pa => pa.id === a.id)
      return prodArtist && JSON.stringify(a) !== JSON.stringify(prodArtist)
    }).length

    const newStudios = localStudios.filter(s => !productionStudioIds.has(s.id)).length
    const modifiedStudios = localStudios.filter(s => {
      if (!productionStudioIds.has(s.id)) return false
      const prodStudio = productionStudios.find(ps => ps.id === s.id)
      return prodStudio && JSON.stringify(s) !== JSON.stringify(prodStudio)
    }).length

    setChanges({
      newArtists,
      modifiedArtists,
      newStudios,
      modifiedStudios
    })
  }

  const handleSyncToProduction = async () => {
    setSyncStatus('syncing')
    try {
      await onSyncToProduction()
      setSyncStatus('success')
      setLastSyncTime(new Date().toISOString())
      
      // Reload production data to reflect changes
      setTimeout(async () => {
        const updatedProdArtists = await loadProductionData()
        // Force recalculation of changes with updated data
        const productionArtistIds = new Set(updatedProdArtists.map(a => a.id))
        
        const newArtists = localArtists.filter(a => !productionArtistIds.has(a.id)).length
        const modifiedArtists = localArtists.filter(a => {
          if (!productionArtistIds.has(a.id)) return false
          const prodArtist = updatedProdArtists.find(pa => pa.id === a.id)
          return prodArtist && JSON.stringify(a) !== JSON.stringify(prodArtist)
        }).length

        setChanges({
          newArtists,
          modifiedArtists,
          newStudios: 0,
          modifiedStudios: 0
        })
        
        setSyncStatus('idle')
      }, 1000)
    } catch (error) {
      console.error('Sync failed:', error)
      setSyncStatus('error')
      setTimeout(() => setSyncStatus('idle'), 3000)
    }
  }

  const getTotalChanges = () => {
    return changes.newArtists + changes.modifiedArtists + changes.newStudios + changes.modifiedStudios
  }

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Database className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusText = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'Syncing to production...'
      case 'success':
        return 'Successfully synced to production'
      case 'error':
        return 'Sync failed - please try again'
      default:
        return 'Ready to sync'
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-amber-600" />
          <h2 className="text-xl font-semibold text-gray-900">Production Deployment</h2>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-800">
            Production deployment is not configured. Please set up Supabase credentials to enable production sync.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitBranch className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Production Deployment</h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Environment Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Local Development</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Artists:</span>
                <span className="font-medium">{localArtists.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Studios:</span>
                <span className="font-medium">{localStudios.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Production</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Artists:</span>
                <span className="font-medium">{productionArtists.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Studios:</span>
                <span className="font-medium">{productionStudios.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Changes Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Pending Changes</h3>
          
          {getTotalChanges() === 0 ? (
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">No changes to deploy</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{changes.newArtists}</div>
                <div className="text-xs text-gray-600">New Artists</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{changes.modifiedArtists}</div>
                <div className="text-xs text-gray-600">Modified Artists</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{changes.newStudios}</div>
                <div className="text-xs text-gray-600">New Studios</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{changes.modifiedStudios}</div>
                <div className="text-xs text-gray-600">Modified Studios</div>
              </div>
            </div>
          )}
        </div>

        {/* Last Sync Info */}
        {lastSyncTime && (
          <div className="mb-6 text-sm text-gray-600">
            Last synced: {new Date(lastSyncTime).toLocaleString()}
          </div>
        )}

        {/* Deploy Button */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {getTotalChanges() > 0 ? (
              <span>Ready to deploy {getTotalChanges()} change{getTotalChanges() !== 1 ? 's' : ''} to production</span>
            ) : (
              <span>Local and production are in sync</span>
            )}
          </div>
          
          <button
            onClick={handleSyncToProduction}
            disabled={syncStatus === 'syncing' || getTotalChanges() === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              getTotalChanges() === 0 || syncStatus === 'syncing'
                ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Upload className="w-4 h-4" />
            {syncStatus === 'syncing' ? 'Deploying...' : 'Deploy to Production'}
          </button>
        </div>

        {/* Warning */}
        {getTotalChanges() > 0 && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <strong>Warning:</strong> This will update your production database. Make sure you've tested your changes thoroughly.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}