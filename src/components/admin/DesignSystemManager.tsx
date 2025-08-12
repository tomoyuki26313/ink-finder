'use client'

import { useState, useEffect } from 'react'
import { 
  Palette, Type, Layout, Square, Circle, 
  MousePointer, Loader2, Check, Copy, Eye,
  Settings, Download, Upload, Plus, Trash2
} from 'lucide-react'

// デザインシステムのコンポーネント定義
interface DesignComponent {
  id: string
  name: string
  category: 'button' | 'card' | 'input' | 'layout' | 'typography' | 'color'
  properties: Record<string, any>
  preview?: string
  customCSS?: string
}

interface DesignSystem {
  id: string
  name: string
  description: string
  components: DesignComponent[]
  globalSettings: {
    colors: Record<string, string>
    spacing: Record<string, string>
    typography: Record<string, any>
    animations: Record<string, string>
  }
  createdAt: string
  updatedAt: string
}

// Shadcn/uiコンポーネント定義
const shadcnComponents = {
  button: {
    variants: {
      default: 'bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md font-medium transition-colors',
      destructive: 'bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-md font-medium transition-colors',
      outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 px-4 py-2 rounded-md font-medium transition-colors',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 px-4 py-2 rounded-md font-medium transition-colors',
      ghost: 'hover:bg-gray-100 text-gray-900 px-4 py-2 rounded-md font-medium transition-colors',
      link: 'text-blue-600 underline-offset-4 hover:underline px-4 py-2 font-medium'
    },
    sizes: {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 px-3 py-1 text-sm',
      lg: 'h-12 px-6 py-3 text-lg',
      icon: 'h-10 w-10 p-0'
    }
  },
  card: {
    variants: {
      default: 'rounded-lg border border-gray-200 bg-white p-6 shadow-sm',
      elevated: 'rounded-lg border border-gray-200 bg-white p-6 shadow-lg',
      outlined: 'rounded-lg border-2 border-gray-300 bg-white p-6'
    }
  },
  input: {
    variants: {
      default: 'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
      error: 'flex h-10 w-full rounded-md border border-red-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500'
    }
  },
  badge: {
    variants: {
      default: 'inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800',
      secondary: 'inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-800',
      destructive: 'inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800',
      outline: 'inline-flex items-center rounded-full border border-gray-300 px-2.5 py-0.5 text-xs font-semibold text-gray-700'
    }
  },
  alert: {
    variants: {
      default: 'relative w-full rounded-lg border border-gray-200 p-4 bg-white text-gray-900',
      destructive: 'relative w-full rounded-lg border border-red-200 p-4 bg-red-50 text-red-900',
      success: 'relative w-full rounded-lg border border-green-200 p-4 bg-green-50 text-green-900',
      warning: 'relative w-full rounded-lg border border-yellow-200 p-4 bg-yellow-50 text-yellow-900'
    }
  },
  toggle: {
    variants: {
      default: 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:outline-none disabled:opacity-50 disabled:pointer-events-none data-[state=on]:bg-gray-200 h-10 px-3',
      outline: 'border border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-900 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 data-[state=on]:bg-gray-700 data-[state=on]:text-gray-100'
    }
  },
  tabs: {
    variants: {
      default: 'inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500',
      underline: 'inline-flex h-10 items-center justify-center bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600'
    }
  },
  progress: {
    variants: {
      default: 'relative h-4 w-full overflow-hidden rounded-full bg-gray-200',
      thin: 'relative h-2 w-full overflow-hidden rounded-full bg-gray-200',
      thick: 'relative h-6 w-full overflow-hidden rounded-full bg-gray-200'
    }
  },
  avatar: {
    variants: {
      default: 'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100',
      large: 'relative flex h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100',
      small: 'relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-100'
    }
  },
  switch: {
    variants: {
      default: 'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-200',
      large: 'peer inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-200'
    }
  },
  checkbox: {
    variants: {
      default: 'peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white',
      large: 'peer h-5 w-5 shrink-0 rounded-sm border border-gray-300 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white'
    }
  },
  select: {
    variants: {
      default: 'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      error: 'flex h-10 w-full items-center justify-between rounded-md border border-red-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
    }
  },
  textarea: {
    variants: {
      default: 'flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      large: 'flex min-h-[120px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
    }
  }
}

// プリセットデザインシステム
const presetDesignSystems: DesignSystem[] = [
  {
    id: 'modern',
    name: 'モダンブルー',
    description: 'クリーンでプロフェッショナルなデザイン',
    components: [
      {
        id: 'button-primary',
        name: 'プライマリボタン',
        category: 'button',
        properties: {
          backgroundColor: '#6366f1',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          transition: 'all 0.2s',
          hover: {
            backgroundColor: '#4f46e5',
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
          }
        }
      },
      {
        id: 'card-default',
        name: 'デフォルトカード',
        category: 'card',
        properties: {
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }
      }
    ],
    globalSettings: {
      colors: {
        primary: '#6366f1',
        secondary: '#ec4899',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        text: '#1f2937',
        background: '#ffffff'
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px'
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: {
          xs: '12px',
          sm: '14px',
          md: '16px',
          lg: '18px',
          xl: '24px'
        }
      },
      animations: {
        duration: '200ms',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'minimal',
    name: 'ミニマル',
    description: 'シンプルで洗練されたデザイン',
    components: [
      {
        id: 'button-primary',
        name: 'プライマリボタン',
        category: 'button',
        properties: {
          backgroundColor: '#000000',
          color: '#ffffff',
          padding: '10px 20px',
          borderRadius: '0px',
          fontSize: '13px',
          fontWeight: '400',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }
      }
    ],
    globalSettings: {
      colors: {
        primary: '#000000',
        secondary: '#666666',
        text: '#000000',
        background: '#ffffff'
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px'
      },
      typography: {
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        fontSize: {
          xs: '11px',
          sm: '13px',
          md: '15px',
          lg: '17px',
          xl: '21px'
        }
      },
      animations: {
        duration: '150ms',
        easing: 'linear'
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'playful',
    name: 'ネオンポップ',
    description: '鮮やかでエネルギッシュなデザイン',
    components: [
      {
        id: 'button-primary',
        name: 'プライマリボタン',
        category: 'button',
        properties: {
          backgroundColor: '#ec4899',
          color: '#ffffff',
          padding: '14px 28px',
          borderRadius: '999px',
          fontSize: '16px',
          fontWeight: '700',
          transform: 'rotate(-2deg)',
          hover: {
            transform: 'rotate(0deg) scale(1.05)'
          }
        }
      }
    ],
    globalSettings: {
      colors: {
        primary: '#ec4899',
        secondary: '#8b5cf6',
        accent: '#fbbf24',
        text: '#1f2937',
        background: '#fef3c7'
      },
      spacing: {
        xs: '6px',
        sm: '12px',
        md: '20px',
        lg: '32px',
        xl: '48px'
      },
      typography: {
        fontFamily: '"Comic Sans MS", cursive',
        fontSize: {
          xs: '14px',
          sm: '16px',
          md: '18px',
          lg: '22px',
          xl: '32px'
        }
      },
      animations: {
        duration: '300ms',
        easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export default function DesignSystemManager() {
  const [designSystems, setDesignSystems] = useState<DesignSystem[]>(presetDesignSystems)
  const [selectedSystem, setSelectedSystem] = useState<DesignSystem | null>(null)
  const [editingComponent, setEditingComponent] = useState<DesignComponent | null>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'editor' | 'preview' | 'live'>('live')
  const [customCSS, setCustomCSS] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [selectedComponentType, setSelectedComponentType] = useState<string>('button')
  const [selectedVariant, setSelectedVariant] = useState<string>('default')
  const [editableTexts, setEditableTexts] = useState<{[key: string]: string}>({})

  // Load saved design systems
  useEffect(() => {
    const saved = localStorage.getItem('custom-design-systems')
    if (saved) {
      const customSystems = JSON.parse(saved)
      setDesignSystems([...presetDesignSystems, ...customSystems])
    }
    
    // Set default design system (first preset)
    if (!selectedSystem && presetDesignSystems.length > 0) {
      setSelectedSystem(presetDesignSystems[0])
    }
  }, [])

  // Apply design system
  const applyDesignSystem = (system: DesignSystem) => {
    // Apply global settings
    const root = document.documentElement
    Object.entries(system.globalSettings.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })
    
    // Save to localStorage
    localStorage.setItem('active-design-system', JSON.stringify(system))
    
    // Trigger update event
    window.dispatchEvent(new CustomEvent('design-system-changed', { detail: system }))
    
    alert(`デザインシステム「${system.name}」を適用しました`)
  }

  // Create custom design system
  const createCustomSystem = () => {
    const newSystem: DesignSystem = {
      id: `custom-${Date.now()}`,
      name: 'カスタムデザイン',
      description: '新しいカスタムデザインシステム',
      components: [],
      globalSettings: {
        colors: {
          primary: '#6366f1',
          secondary: '#ec4899',
          text: '#1f2937',
          background: '#ffffff'
        },
        spacing: {
          xs: '4px',
          sm: '8px',
          md: '16px',
          lg: '24px',
          xl: '32px'
        },
        typography: {
          fontFamily: 'sans-serif',
          fontSize: {
            sm: '14px',
            md: '16px',
            lg: '18px'
          }
        },
        animations: {
          duration: '200ms',
          easing: 'ease'
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    setDesignSystems([...designSystems, newSystem])
    setSelectedSystem(newSystem)
    setActiveTab('editor')
  }

  // Component editor
  const ComponentEditor = ({ component }: { component: DesignComponent }) => (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="font-medium mb-3 text-black">{component.name}</h4>
      
      <div className="space-y-3">
        {Object.entries(component.properties).map(([key, value]) => {
          if (typeof value === 'string' && value.startsWith('#')) {
            // Color picker
            return (
              <div key={key} className="flex items-center gap-2">
                <label className="text-sm w-32 text-black">{key}:</label>
                <input
                  type="color"
                  value={value}
                  onChange={(e) => {
                    const updated = { ...component, properties: { ...component.properties, [key]: e.target.value }}
                    setEditingComponent(updated)
                  }}
                  className="w-10 h-10 rounded"
                />
                <input
                  type="text"
                  value={value}
                  onChange={(e) => {
                    const updated = { ...component, properties: { ...component.properties, [key]: e.target.value }}
                    setEditingComponent(updated)
                  }}
                  className="flex-1 px-2 py-1 text-sm border rounded text-black"
                />
              </div>
            )
          } else if (typeof value === 'string') {
            // Text input
            return (
              <div key={key} className="flex items-center gap-2">
                <label className="text-sm w-32 text-black">{key}:</label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => {
                    const updated = { ...component, properties: { ...component.properties, [key]: e.target.value }}
                    setEditingComponent(updated)
                  }}
                  className="flex-1 px-2 py-1 text-sm border rounded text-black"
                />
              </div>
            )
          }
          return null
        })}
      </div>
      
      {/* Custom CSS */}
      <div className="mt-4">
        <label className="text-sm font-medium text-black">カスタムCSS:</label>
        <textarea
          value={component.customCSS || ''}
          onChange={(e) => {
            const updated = { ...component, customCSS: e.target.value }
            setEditingComponent(updated)
          }}
          className="w-full mt-1 p-2 text-sm font-mono border rounded text-black"
          rows={4}
          placeholder=".button { /* your custom styles */ }"
        />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black">デザインシステムマネージャー</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              {showSidebar ? '編集パネルを隠す' : '編集パネルを表示'}
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded ${activeTab === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-black'}`}
            >
              リスト
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2 rounded ${activeTab === 'editor' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-black'}`}
            >
              エディター
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 rounded ${activeTab === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-black'}`}
            >
              プレビュー
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`px-4 py-2 rounded ${activeTab === 'live' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-black'}`}
            >
              ライブプレビュー
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex h-screen">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-80 bg-white border-r p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Design System Selector */}
              <div>
                <h3 className="font-semibold text-black mb-3">デザインシステム</h3>
                <select
                  value={selectedSystem?.id || ''}
                  onChange={(e) => {
                    const system = designSystems.find(s => s.id === e.target.value)
                    setSelectedSystem(system || null)
                  }}
                  className="w-full px-3 py-2 border rounded text-black"
                >
                  <option value="">選択してください</option>
                  {designSystems.map(system => (
                    <option key={system.id} value={system.id}>{system.name}</option>
                  ))}
                </select>
              </div>

              {selectedSystem && (
                <>
                  {/* Component Selection */}
                  <div>
                    <h3 className="font-semibold text-black mb-3">コンポーネント選択</h3>
                    <select
                      value={selectedComponentType}
                      onChange={(e) => {
                        setSelectedComponentType(e.target.value)
                        setSelectedVariant('default') // Reset variant when component type changes
                      }}
                      className="w-full px-3 py-2 border rounded text-black mb-3"
                    >
                      <option value="button">ボタン</option>
                      <option value="card">カード</option>
                      <option value="input">インプット</option>
                      <option value="badge">バッジ</option>
                      <option value="alert">アラート</option>
                      <option value="toggle">トグル</option>
                      <option value="tabs">タブ</option>
                      <option value="progress">プログレス</option>
                      <option value="avatar">アバター</option>
                      <option value="switch">スイッチ</option>
                      <option value="checkbox">チェックボックス</option>
                      <option value="select">セレクト</option>
                      <option value="textarea">テキストエリア</option>
                    </select>

                    {/* Component Variants */}
                    {selectedComponentType && shadcnComponents[selectedComponentType as keyof typeof shadcnComponents] && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-black">バリエーション</h4>
                        {Object.entries(shadcnComponents[selectedComponentType as keyof typeof shadcnComponents].variants).map(([variant, classes]) => (
                          <div 
                            key={variant} 
                            className={`border rounded p-3 cursor-pointer transition-colors ${
                              selectedVariant === variant 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedVariant(variant)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm text-black font-medium capitalize">{variant}</p>
                              {selectedVariant === variant && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                            <div className="mb-2">
                              {selectedComponentType === 'button' && (
                                <button className={classes}>
                                  サンプルボタン
                                </button>
                              )}
                              {selectedComponentType === 'card' && (
                                <div className={classes}>
                                  <div>
                                    <h3 className="font-semibold text-black">カードタイトル</h3>
                                    <p className="text-sm text-gray-600">カードの内容です</p>
                                  </div>
                                </div>
                              )}
                              {selectedComponentType === 'input' && (
                                <input className={classes} placeholder="入力フィールド" readOnly />
                              )}
                              {selectedComponentType === 'badge' && (
                                <span className={classes}>サンプルバッジ</span>
                              )}
                              {selectedComponentType === 'alert' && (
                                <div className={classes}>
                                  <p className="text-sm">アラートメッセージの例</p>
                                </div>
                              )}
                              {selectedComponentType === 'toggle' && (
                                <button className={classes}>
                                  トグル
                                </button>
                              )}
                              {selectedComponentType === 'tabs' && (
                                <div className={classes}>
                                  <div className="text-sm">タブ1</div>
                                </div>
                              )}
                              {selectedComponentType === 'progress' && (
                                <div className={classes}>
                                  <div className="h-full w-1/2 bg-blue-600 rounded-full"></div>
                                </div>
                              )}
                              {selectedComponentType === 'avatar' && (
                                <div className={classes}>
                                  <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center text-xs">U</div>
                                </div>
                              )}
                              {selectedComponentType === 'switch' && (
                                <div className={classes}>
                                  <div className="h-5 w-5 rounded-full bg-white shadow transform transition-transform translate-x-0"></div>
                                </div>
                              )}
                              {selectedComponentType === 'checkbox' && (
                                <div className={classes}>
                                  <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                              {selectedComponentType === 'select' && (
                                <div className={classes}>
                                  <span className="text-sm">オプションを選択</span>
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              )}
                              {selectedComponentType === 'textarea' && (
                                <textarea className={classes} placeholder="テキストエリア" rows={3} readOnly />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-2 font-mono">{classes}</p>
                          </div>
                        ))}
                        
                        {/* Apply Selected Variant Button */}
                        <button
                          onClick={() => {
                            // Apply selected variant to preview
                            const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement
                            if (iframe?.contentWindow && selectedSystem) {
                              const iframeDoc = iframe.contentWindow.document
                              const selectedClasses = shadcnComponents[selectedComponentType as keyof typeof shadcnComponents].variants[selectedVariant]
                              
                              // Tailwind color mapping
                              const colorMap: {[key: string]: string} = {
                                'bg-blue-100': '#dbeafe',
                                'bg-blue-600': '#2563eb',
                                'bg-blue-700': '#1d4ed8',
                                'bg-red-100': '#fee2e2',
                                'bg-red-600': '#dc2626',
                                'bg-red-700': '#b91c1c',
                                'bg-red-50': '#fef2f2',
                                'bg-green-50': '#f0fdf4',
                                'bg-yellow-50': '#fefce8',
                                'bg-blue-50': '#eff6ff',
                                'bg-gray-50': '#f9fafb',
                                'bg-gray-100': '#f3f4f6',
                                'bg-gray-200': '#e5e7eb',
                                'bg-gray-700': '#374151',
                                'bg-white': '#ffffff',
                                'text-blue-800': '#1e40af',
                                'text-red-800': '#991b1b',
                                'text-red-900': '#7f1d1d',
                                'text-green-900': '#14532d',
                                'text-yellow-900': '#713f12',
                                'text-gray-500': '#6b7280',
                                'text-gray-700': '#374151',
                                'text-gray-800': '#1f2937',
                                'text-gray-900': '#111827',
                                'text-white': '#ffffff',
                                'border-gray-200': '#e5e7eb',
                                'border-gray-300': '#d1d5db',
                                'border-red-200': '#fecaca',
                                'border-red-300': '#fca5a5',
                                'border-green-200': '#bbf7d0',
                                'border-yellow-200': '#fde68a',
                                'border-blue-500': '#3b82f6'
                              }
                              
                              // Convert Tailwind classes to actual CSS
                              const convertTailwindToCSS = (classes: string) => {
                                return classes.split(' ').map(cls => {
                                  if (colorMap[cls]) {
                                    if (cls.startsWith('bg-')) return `background-color: ${colorMap[cls]} !important;`
                                    if (cls.startsWith('text-')) return `color: ${colorMap[cls]} !important;`
                                    if (cls.startsWith('border-') && !cls.includes('border-2')) return `border-color: ${colorMap[cls]} !important;`
                                  }
                                  if (cls === 'border') return 'border: 1px solid !important;'
                                  if (cls === 'border-2') return 'border: 2px solid !important;'
                                  if (cls === 'rounded-full') return 'border-radius: 9999px !important;'
                                  if (cls === 'rounded-md') return 'border-radius: 0.375rem !important;'
                                  if (cls === 'rounded-lg') return 'border-radius: 0.5rem !important;'
                                  if (cls.startsWith('px-')) return `padding-left: ${parseFloat(cls.split('-')[1]) * 0.25}rem !important; padding-right: ${parseFloat(cls.split('-')[1]) * 0.25}rem !important;`
                                  if (cls.startsWith('py-')) return `padding-top: ${parseFloat(cls.split('-')[1]) * 0.25}rem !important; padding-bottom: ${parseFloat(cls.split('-')[1]) * 0.25}rem !important;`
                                  if (cls === 'text-xs') return 'font-size: 0.75rem !important; line-height: 1rem !important;'
                                  if (cls === 'text-sm') return 'font-size: 0.875rem !important; line-height: 1.25rem !important;'
                                  if (cls === 'font-semibold') return 'font-weight: 600 !important;'
                                  if (cls === 'font-medium') return 'font-weight: 500 !important;'
                                  if (cls === 'inline-flex') return 'display: inline-flex !important;'
                                  if (cls === 'items-center') return 'align-items: center !important;'
                                  if (cls === 'transition-colors') return 'transition-property: color, background-color, border-color !important; transition-duration: 150ms !important;'
                                  return ''
                                }).filter(Boolean).join(' ')
                              }
                              
                              // Create style for selected component variant
                              const style = iframeDoc.createElement('style')
                              const cssRules = convertTailwindToCSS(selectedClasses)
                              
                              style.innerHTML = `
                                /* Apply selected ${selectedComponentType} variant: ${selectedVariant} */
                                ${selectedComponentType === 'button' ? `
                                  button.bg-purple-600, 
                                  .bg-purple-600 { 
                                    ${cssRules}
                                  }
                                  button.bg-purple-600:hover,
                                  .bg-purple-600:hover {
                                    filter: brightness(0.9) !important;
                                  }
                                ` : ''}
                                
                                ${selectedComponentType === 'badge' ? `
                                  .px-3.py-1\\.5.rounded-full,
                                  .bg-purple-100,
                                  span[class*="px-2.5"][class*="py-0.5"][class*="rounded-full"] { 
                                    ${cssRules}
                                  }
                                ` : ''}
                                
                                ${selectedComponentType === 'card' ? `
                                  .bg-white.rounded-xl.shadow-sm,
                                  .rounded-lg.border { 
                                    ${cssRules}
                                  }
                                ` : ''}
                                
                                ${selectedComponentType === 'input' ? `
                                  input[type="text"],
                                  input[type="email"],
                                  input.px-2,
                                  .border.rounded { 
                                    ${cssRules}
                                  }
                                ` : ''}
                                
                                ${selectedComponentType === 'alert' ? `
                                  .bg-red-50,
                                  .bg-green-50,
                                  .bg-yellow-50,
                                  .bg-blue-50,
                                  [class*="border"][class*="rounded-lg"][class*="p-4"] { 
                                    ${cssRules}
                                  }
                                ` : ''}
                                
                                ${selectedComponentType === 'toggle' ? `
                                  .hover\\:bg-gray-100,
                                  [class*="inline-flex"][class*="items-center"][class*="justify-center"] { 
                                    ${cssRules}
                                  }
                                ` : ''}
                                
                                ${selectedComponentType === 'tabs' ? `
                                  [class*="inline-flex"][class*="h-10"][class*="items-center"] { 
                                    ${cssRules}
                                  }
                                ` : ''}
                                
                                ${selectedComponentType === 'progress' ? `
                                  [class*="h-4"][class*="w-full"][class*="overflow-hidden"][class*="rounded-full"] { 
                                    ${cssRules}
                                  }
                                ` : ''}
                                
                                ${selectedComponentType === 'avatar' ? `
                                  [class*="flex"][class*="shrink-0"][class*="overflow-hidden"][class*="rounded-full"] { 
                                    ${cssRules}
                                  }
                                ` : ''}
                                
                                ${selectedComponentType === 'switch' ? `
                                  [class*="inline-flex"][class*="shrink-0"][class*="cursor-pointer"] { 
                                    ${cssRules}
                                  }
                                ` : ''}
                                
                                ${selectedComponentType === 'checkbox' ? `
                                  [class*="shrink-0"][class*="rounded-sm"][class*="border"] { 
                                    ${cssRules}
                                  }
                                ` : ''}
                                
                                ${selectedComponentType === 'select' ? `
                                  select,
                                  [class*="flex"][class*="items-center"][class*="justify-between"] { 
                                    ${cssRules}
                                  }
                                ` : ''}
                                
                                ${selectedComponentType === 'textarea' ? `
                                  textarea,
                                  [class*="min-h-"][class*="rounded-md"][class*="border"] { 
                                    ${cssRules}
                                  }
                                ` : ''}
                              `
                              
                              // Remove old variant style if exists
                              const oldStyle = iframeDoc.getElementById('component-variant-preview')
                              if (oldStyle) oldStyle.remove()
                              
                              style.id = 'component-variant-preview'
                              iframeDoc.head.appendChild(style)
                            }
                          }}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                        >
                          選択したバリエーションを適用
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Text Editor */}
                  <div>
                    <h3 className="font-semibold text-black mb-3">テキスト編集</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-black">アプリタイトル</label>
                        <input
                          type="text"
                          value={editableTexts.appTitle || 'Ink Finder'}
                          onChange={(e) => setEditableTexts({...editableTexts, appTitle: e.target.value})}
                          className="w-full px-2 py-1 text-sm border rounded text-black mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-black">タグライン</label>
                        <input
                          type="text"
                          value={editableTexts.tagline || 'Find Your Perfect Tattoo Artist'}
                          onChange={(e) => setEditableTexts({...editableTexts, tagline: e.target.value})}
                          className="w-full px-2 py-1 text-sm border rounded text-black mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-black">検索結果メッセージ</label>
                        <input
                          type="text"
                          value={editableTexts.artistsFound || 'アーティストが見つかりました'}
                          onChange={(e) => setEditableTexts({...editableTexts, artistsFound: e.target.value})}
                          className="w-full px-2 py-1 text-sm border rounded text-black mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-black">ボタンテキスト</label>
                        <input
                          type="text"
                          value={editableTexts.buttonText || 'もっと見る'}
                          onChange={(e) => setEditableTexts({...editableTexts, buttonText: e.target.value})}
                          className="w-full px-2 py-1 text-sm border rounded text-black mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Color Controls */}
                  <div>
                    <h3 className="font-semibold text-black mb-3">カラー設定</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-black">プライマリ</label>
                        <div className="flex gap-2 mt-1">
                          <input
                            type="color"
                            value={selectedSystem.globalSettings.colors.primary}
                            onChange={(e) => {
                              const updated = {
                                ...selectedSystem,
                                globalSettings: {
                                  ...selectedSystem.globalSettings,
                                  colors: {
                                    ...selectedSystem.globalSettings.colors,
                                    primary: e.target.value
                                  }
                                }
                              }
                              setSelectedSystem(updated)
                            }}
                            className="w-10 h-10 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={selectedSystem.globalSettings.colors.primary}
                            onChange={(e) => {
                              const updated = {
                                ...selectedSystem,
                                globalSettings: {
                                  ...selectedSystem.globalSettings,
                                  colors: {
                                    ...selectedSystem.globalSettings.colors,
                                    primary: e.target.value
                                  }
                                }
                              }
                              setSelectedSystem(updated)
                            }}
                            className="flex-1 px-2 py-1 text-sm border rounded text-black"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-black">セカンダリ</label>
                        <div className="flex gap-2 mt-1">
                          <input
                            type="color"
                            value={selectedSystem.globalSettings.colors.secondary}
                            onChange={(e) => {
                              const updated = {
                                ...selectedSystem,
                                globalSettings: {
                                  ...selectedSystem.globalSettings,
                                  colors: {
                                    ...selectedSystem.globalSettings.colors,
                                    secondary: e.target.value
                                  }
                                }
                              }
                              setSelectedSystem(updated)
                            }}
                            className="w-10 h-10 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={selectedSystem.globalSettings.colors.secondary}
                            onChange={(e) => {
                              const updated = {
                                ...selectedSystem,
                                globalSettings: {
                                  ...selectedSystem.globalSettings,
                                  colors: {
                                    ...selectedSystem.globalSettings.colors,
                                    secondary: e.target.value
                                  }
                                }
                              }
                              setSelectedSystem(updated)
                            }}
                            className="flex-1 px-2 py-1 text-sm border rounded text-black"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Apply Button */}
                  <div>
                    <button
                      onClick={() => {
                        // Apply to iframe
                        const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement
                        if (iframe?.contentWindow) {
                          const iframeDoc = iframe.contentWindow.document
                          const root = iframeDoc.documentElement
                          
                          // Apply colors
                          Object.entries(selectedSystem.globalSettings.colors).forEach(([key, value]) => {
                            root.style.setProperty(`--color-${key}`, value)
                          })
                          
                          // Apply text changes
                          Object.entries(editableTexts).forEach(([key, value]) => {
                            root.style.setProperty(`--text-${key}`, `"${value}"`)
                          })
                          
                          // Apply styles to specific elements
                          const style = iframeDoc.createElement('style')
                          style.innerHTML = `
                            /* Primary color overrides */
                            .bg-purple-600 { background-color: ${selectedSystem.globalSettings.colors.primary} !important; }
                            .text-purple-600 { color: ${selectedSystem.globalSettings.colors.primary} !important; }
                            .border-purple-500 { border-color: ${selectedSystem.globalSettings.colors.primary} !important; }
                            .hover\\:bg-purple-700:hover { background-color: ${selectedSystem.globalSettings.colors.primary} !important; filter: brightness(0.9); }
                            
                            /* Secondary color overrides */
                            .bg-blue-600 { background-color: ${selectedSystem.globalSettings.colors.secondary} !important; }
                            .text-blue-600 { color: ${selectedSystem.globalSettings.colors.secondary} !important; }
                            
                            /* Typography */
                            body { font-family: ${selectedSystem.globalSettings.typography.fontFamily} !important; }
                            
                            /* Text overrides */
                            ${editableTexts.appTitle ? `h1:contains("Ink Finder") { display: none; } h1:after { content: "${editableTexts.appTitle}"; }` : ''}
                          `
                          
                          // Remove old style if exists
                          const oldStyle = iframeDoc.getElementById('design-system-preview')
                          if (oldStyle) oldStyle.remove()
                          
                          style.id = 'design-system-preview'
                          iframeDoc.head.appendChild(style)
                        }
                      }}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      変更を適用
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 relative">
          {activeTab === 'list' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New Card */}
            <div 
              onClick={createCustomSystem}
              className="bg-white rounded-lg p-6 border-2 border-dashed border-gray-300 hover:border-blue-500 cursor-pointer flex flex-col items-center justify-center min-h-[200px]"
            >
              <Plus className="w-12 h-12 text-black mb-2" />
              <p className="text-black">新規作成</p>
            </div>

            {/* Design System Cards */}
            {designSystems.map((system) => (
              <div key={system.id} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-2 text-black">{system.name}</h3>
                <p className="text-sm text-black mb-4">{system.description}</p>
                
                {/* Color Preview */}
                <div className="flex gap-1 mb-4">
                  {Object.entries(system.globalSettings.colors).slice(0, 5).map(([key, color]) => (
                    <div
                      key={key}
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: color }}
                      title={`${key}: ${color}`}
                    />
                  ))}
                </div>
                
                {/* Components Count */}
                <p className="text-xs text-black mb-4">
                  {system.components.length} コンポーネント
                </p>
                
                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => applyDesignSystem(system)}
                    className="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
                  >
                    適用
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSystem(system)
                      setActiveTab('editor')
                    }}
                    className="flex-1 bg-gray-100 text-black px-3 py-1.5 rounded text-sm hover:bg-gray-200"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSystem(system)
                      setShowPreview(true)
                    }}
                    className="p-1.5 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
              </div>
            </div>
          )}

          {/* Live Preview - Default View */}
          {activeTab === 'live' && (
            <div className="h-full">
              <div className="h-full bg-white overflow-hidden">
                <div className="bg-gray-100 p-2 flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex-1 bg-white rounded px-2 py-1 text-xs text-black">
                    http://localhost:3002/ja
                  </div>
                  {selectedSystem && (
                    <div className="text-sm text-black">
                      {selectedSystem.name}
                    </div>
                  )}
                </div>
                <iframe
                  id="preview-iframe"
                  src="/ja"
                  className="w-full h-full border-0"
                  title="Live Preview"
                />
              </div>
            </div>
          )}

          {activeTab === 'editor' && selectedSystem && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Settings */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-black">グローバル設定</h2>
              
              {/* Colors */}
              <div className="mb-6">
                <h3 className="font-medium mb-3 flex items-center gap-2 text-black">
                  <Palette className="w-4 h-4" />
                  カラーパレット
                </h3>
                <div className="space-y-2">
                  {Object.entries(selectedSystem.globalSettings.colors).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <label className="text-sm w-24 text-black">{key}:</label>
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => {
                          const updated = {
                            ...selectedSystem,
                            globalSettings: {
                              ...selectedSystem.globalSettings,
                              colors: {
                                ...selectedSystem.globalSettings.colors,
                                [key]: e.target.value
                              }
                            }
                          }
                          setSelectedSystem(updated)
                        }}
                        className="w-10 h-8 rounded"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => {
                          const updated = {
                            ...selectedSystem,
                            globalSettings: {
                              ...selectedSystem.globalSettings,
                              colors: {
                                ...selectedSystem.globalSettings.colors,
                                [key]: e.target.value
                              }
                            }
                          }
                          setSelectedSystem(updated)
                        }}
                        className="flex-1 px-2 py-1 text-sm border rounded text-black"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Typography */}
              <div className="mb-6">
                <h3 className="font-medium mb-3 flex items-center gap-2 text-black">
                  <Type className="w-4 h-4" />
                  タイポグラフィ
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm w-24 text-black">Font:</label>
                    <input
                      type="text"
                      value={selectedSystem.globalSettings.typography.fontFamily}
                      onChange={(e) => {
                        const updated = {
                          ...selectedSystem,
                          globalSettings: {
                            ...selectedSystem.globalSettings,
                            typography: {
                              ...selectedSystem.globalSettings.typography,
                              fontFamily: e.target.value
                            }
                          }
                        }
                        setSelectedSystem(updated)
                      }}
                      className="flex-1 px-2 py-1 text-sm border rounded text-black"
                    />
                  </div>
                </div>
              </div>

              {/* Spacing */}
              <div className="mb-6">
                <h3 className="font-medium mb-3 flex items-center gap-2 text-black">
                  <Layout className="w-4 h-4" />
                  スペーシング
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(selectedSystem.globalSettings.spacing).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <label className="text-sm w-10 text-black">{key}:</label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => {
                          const updated = {
                            ...selectedSystem,
                            globalSettings: {
                              ...selectedSystem.globalSettings,
                              spacing: {
                                ...selectedSystem.globalSettings.spacing,
                                [key]: e.target.value
                              }
                            }
                          }
                          setSelectedSystem(updated)
                        }}
                        className="flex-1 px-2 py-1 text-sm border rounded text-black"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Components */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-black">コンポーネント</h2>
              
              <div className="space-y-4">
                {selectedSystem.components.map((component) => (
                  <div key={component.id}>
                    {editingComponent?.id === component.id ? (
                      <ComponentEditor component={editingComponent} />
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-black">{component.name}</h4>
                          <button
                            onClick={() => setEditingComponent(component)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Component Preview */}
                        {component.category === 'button' && (
                          <button
                            style={component.properties}
                            className="mt-2"
                          >
                            サンプルボタン
                          </button>
                        )}
                        
                        {component.category === 'card' && (
                          <div
                            style={component.properties}
                            className="mt-2"
                          >
                            <p className="text-sm">サンプルカード</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Add Component Button */}
                <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-black hover:border-blue-500 hover:text-blue-600">
                  + コンポーネントを追加
                </button>
              </div>
            </div>
              </div>
            </div>
          )}

          {activeTab === 'preview' && selectedSystem && (
            <div className="p-6">
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-black">プレビュー: {selectedSystem.name}</h2>
            
            {/* Live Preview Area */}
            <div className="border-2 border-gray-200 rounded-lg p-8">
              <div className="space-y-8">
                {/* Buttons */}
                <div>
                  <h3 className="text-lg font-medium mb-4 text-black">ボタン</h3>
                  <div className="flex gap-4">
                    {selectedSystem.components
                      .filter(c => c.category === 'button')
                      .map(button => (
                        <button
                          key={button.id}
                          style={button.properties}
                        >
                          {button.name}
                        </button>
                      ))}
                  </div>
                </div>
                
                {/* Cards */}
                <div>
                  <h3 className="text-lg font-medium mb-4 text-black">カード</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedSystem.components
                      .filter(c => c.category === 'card')
                      .map(card => (
                        <div
                          key={card.id}
                          style={card.properties}
                        >
                          <h4 className="font-medium mb-2 text-black">カードタイトル</h4>
                          <p className="text-sm text-black">
                            これはサンプルカードの内容です。実際のコンテンツがここに表示されます。
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
                
                {/* Typography */}
                <div>
                  <h3 className="text-lg font-medium mb-4 text-black">タイポグラフィ</h3>
                  <div 
                    className="space-y-2"
                    style={{ fontFamily: selectedSystem.globalSettings.typography.fontFamily }}
                  >
                    {Object.entries(selectedSystem.globalSettings.typography.fontSize || {}).map(([size, value]) => (
                      <p key={size} style={{ fontSize: value }}>
                        {size}: これは{size}サイズのテキストサンプルです
                      </p>
                    ))}
                  </div>
                </div>
                
                {/* Color Palette */}
                <div>
                  <h3 className="text-lg font-medium mb-4 text-black">カラーパレット</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {Object.entries(selectedSystem.globalSettings.colors).map(([name, color]) => (
                      <div key={name} className="text-center">
                        <div
                          className="w-full h-20 rounded-lg mb-2"
                          style={{ backgroundColor: color }}
                        />
                        <p className="text-sm font-medium text-black">{name}</p>
                        <p className="text-xs text-black">{color}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Export/Import */}
            <div className="mt-6 flex gap-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">
                <Download className="w-4 h-4" />
                エクスポート (JSON)
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">
                <Upload className="w-4 h-4" />
                インポート
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">
                <Copy className="w-4 h-4" />
                CSS生成
              </button>
            </div>
            </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}