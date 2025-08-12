'use client'

import { useState, useEffect } from 'react'
import { Palette, Layout, Type, Moon, Sun, Save } from 'lucide-react'

interface UIConfig {
  theme: {
    primaryColor: string
    secondaryColor: string
    borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
    cardStyle: 'minimal' | 'standard' | 'detailed'
  }
  layout: {
    artistsView: 'grid' | 'list'
    columnsDesktop: 2 | 3 | 4
    columnsMobile: 1 | 2
  }
  typography: {
    fontSize: 'small' | 'medium' | 'large'
    fontFamily: 'default' | 'serif' | 'mono'
  }
  features: {
    darkMode: boolean
    animations: boolean
    compactMode: boolean
  }
}

export default function UIConfigPanel() {
  const [config, setConfig] = useState<UIConfig>({
    theme: {
      primaryColor: '#6366f1',
      secondaryColor: '#ec4899',
      borderRadius: 'lg',
      cardStyle: 'standard'
    },
    layout: {
      artistsView: 'grid',
      columnsDesktop: 3,
      columnsMobile: 1
    },
    typography: {
      fontSize: 'medium',
      fontFamily: 'default'
    },
    features: {
      darkMode: false,
      animations: true,
      compactMode: false
    }
  })

  // Load saved config
  useEffect(() => {
    const savedConfig = localStorage.getItem('ui-config')
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig))
    }
  }, [])

  // Save config
  const saveConfig = () => {
    localStorage.setItem('ui-config', JSON.stringify(config))
    
    // Apply changes to CSS variables
    const root = document.documentElement
    root.style.setProperty('--primary-color', config.theme.primaryColor)
    root.style.setProperty('--secondary-color', config.theme.secondaryColor)
    
    // Trigger reload or update event
    window.dispatchEvent(new CustomEvent('ui-config-updated', { detail: config }))
    
    alert('UI設定を保存しました。ページをリロードして変更を確認してください。')
  }

  // Live preview
  const applyPreview = () => {
    const root = document.documentElement
    root.style.setProperty('--primary-color', config.theme.primaryColor)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">UI設定</h2>
      
      {/* Theme Settings */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          テーマ設定
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              プライマリカラー
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.theme.primaryColor}
                onChange={(e) => {
                  setConfig(prev => ({
                    ...prev,
                    theme: { ...prev.theme, primaryColor: e.target.value }
                  }))
                  applyPreview()
                }}
                className="w-12 h-10 rounded border border-gray-300"
              />
              <input
                type="text"
                value={config.theme.primaryColor}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  theme: { ...prev.theme, primaryColor: e.target.value }
                }))}
                className="flex-1 px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              角丸の大きさ
            </label>
            <select
              value={config.theme.borderRadius}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                theme: { ...prev.theme, borderRadius: e.target.value as any }
              }))}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="none">なし</option>
              <option value="sm">小</option>
              <option value="md">中</option>
              <option value="lg">大</option>
              <option value="xl">特大</option>
              <option value="full">完全な円</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              カードスタイル
            </label>
            <select
              value={config.theme.cardStyle}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                theme: { ...prev.theme, cardStyle: e.target.value as any }
              }))}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="minimal">ミニマル</option>
              <option value="standard">標準</option>
              <option value="detailed">詳細</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Layout Settings */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Layout className="w-5 h-5" />
          レイアウト設定
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              アーティスト表示
            </label>
            <select
              value={config.layout.artistsView}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                layout: { ...prev.layout, artistsView: e.target.value as any }
              }))}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="grid">グリッド</option>
              <option value="list">リスト</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              デスクトップ列数
            </label>
            <select
              value={config.layout.columnsDesktop}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                layout: { ...prev.layout, columnsDesktop: Number(e.target.value) as any }
              }))}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="2">2列</option>
              <option value="3">3列</option>
              <option value="4">4列</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Typography Settings */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Type className="w-5 h-5" />
          文字設定
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              文字サイズ
            </label>
            <select
              value={config.typography.fontSize}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                typography: { ...prev.typography, fontSize: e.target.value as any }
              }))}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="small">小</option>
              <option value="medium">中</option>
              <option value="large">大</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Features */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">機能設定</h3>
        
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={config.features.darkMode}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                features: { ...prev.features, darkMode: e.target.checked }
              }))}
              className="w-4 h-4"
            />
            <span className="flex items-center gap-2">
              {config.features.darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              ダークモード
            </span>
          </label>
          
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={config.features.animations}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                features: { ...prev.features, animations: e.target.checked }
              }))}
              className="w-4 h-4"
            />
            <span>アニメーション効果</span>
          </label>
          
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={config.features.compactMode}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                features: { ...prev.features, compactMode: e.target.checked }
              }))}
              className="w-4 h-4"
            />
            <span>コンパクトモード</span>
          </label>
        </div>
      </div>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveConfig}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          <Save className="w-4 h-4" />
          設定を保存
        </button>
      </div>
      
      {/* Live Preview */}
      <div className="mt-8 p-4 border-2 border-dashed border-gray-300 rounded-lg">
        <h4 className="text-sm font-medium mb-3">プレビュー</h4>
        <div className="grid grid-cols-3 gap-2">
          <div 
            className="p-3 text-white text-center rounded"
            style={{ 
              backgroundColor: config.theme.primaryColor,
              borderRadius: config.theme.borderRadius === 'full' ? '9999px' : 
                           config.theme.borderRadius === 'xl' ? '1rem' :
                           config.theme.borderRadius === 'lg' ? '0.5rem' :
                           config.theme.borderRadius === 'md' ? '0.375rem' :
                           config.theme.borderRadius === 'sm' ? '0.125rem' : '0'
            }}
          >
            プライマリ
          </div>
          <div 
            className="p-3 text-white text-center"
            style={{ 
              backgroundColor: config.theme.secondaryColor,
              borderRadius: config.theme.borderRadius === 'full' ? '9999px' : 
                           config.theme.borderRadius === 'xl' ? '1rem' :
                           config.theme.borderRadius === 'lg' ? '0.5rem' :
                           config.theme.borderRadius === 'md' ? '0.375rem' :
                           config.theme.borderRadius === 'sm' ? '0.125rem' : '0'
            }}
          >
            セカンダリ
          </div>
        </div>
      </div>
    </div>
  )
}