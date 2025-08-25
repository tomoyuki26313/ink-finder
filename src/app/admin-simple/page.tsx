'use client'

import { useState } from 'react'

// 最小限の管理画面実装
export default function SimpleAdminPage() {
  const [password, setPassword] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      const data = await response.json()

      if (response.ok) {
        setIsLoggedIn(true)
        setError('')
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  if (isLoggedIn) {
    return (
      <>
        <style dangerouslySetInnerHTML={{
          __html: `
            .admin-container {
              padding: 15px;
              font-family: Arial, sans-serif;
              min-height: 100vh;
              background-color: #f8f9fa;
            }
            .header-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
              gap: 10px;
            }
            .admin-title {
              margin: 0;
              font-size: 24px;
            }
            .logout-btn {
              padding: 10px 20px;
              background-color: #dc3545;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            }
            .buttons-row {
              margin-bottom: 20px;
              display: flex;
              gap: 10px;
            }
            .btn-link {
              padding: 12px 24px;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              display: block;
              text-align: center;
              flex: 1;
            }
            .btn-primary {
              background-color: #007bff;
            }
            .btn-success {
              background-color: #28a745;
            }
            @media (max-width: 768px) {
              .admin-container {
                padding: 10px;
              }
              .header-row {
                flex-direction: column;
                align-items: stretch;
              }
              .logout-btn {
                align-self: flex-start;
              }
              .buttons-row {
                flex-direction: column;
              }
            }
          `
        }} />
        <div className="admin-container">
          <div className="header-row">
            <h1 className="admin-title">Admin Panel</h1>
            <button 
              onClick={() => setIsLoggedIn(false)}
              className="logout-btn"
            >
              Logout
            </button>
          </div>
          
          <div className="buttons-row">
            <a href="/admin" className="btn-link btn-primary">
              Go to Full Admin Dashboard
            </a>
            <a href="/admin/artists/new" className="btn-link btn-success">
              Add New Artist
            </a>
          </div>
        
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '4px',
          border: '1px solid #e9ecef'
        }}>
          <h3>Quick Links:</h3>
          <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
            <li style={{ marginBottom: '5px' }}>
              <a href="/admin/artists" style={{ color: '#007bff', textDecoration: 'none' }}>
                Manage Artists
              </a>
            </li>
            <li style={{ marginBottom: '5px' }}>
              <a href="/admin/styles" style={{ color: '#007bff', textDecoration: 'none' }}>
                Manage Styles
              </a>
            </li>
            <li style={{ marginBottom: '5px' }}>
              <a href="/" style={{ color: '#007bff', textDecoration: 'none' }}>
                View Site
              </a>
            </li>
          </ul>
        </div>
      </div>
      </>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .login-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f5f5f5;
            font-family: Arial, sans-serif;
            padding: 0;
          }
          .login-card {
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
          }
          .login-title {
            text-align: center;
            margin-bottom: 30px;
          }
          .form-group {
            margin-bottom: 20px;
          }
          .form-label {
            display: block;
            margin-bottom: 5px;
          }
          .form-input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
            box-sizing: border-box;
          }
          .error-message {
            background-color: #f8d7da;
            color: #721c24;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 20px;
            border: 1px solid #f5c6cb;
          }
          .login-btn {
            width: 100%;
            padding: 12px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
          }
          .login-btn:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
          }
          .help-text {
            margin-top: 20px;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
          @media (max-width: 768px) {
            .login-container {
              padding: 20px;
            }
            .login-card {
              padding: 30px 20px;
            }
          }
        `
      }} />
      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">
            Simple Admin Login
          </h1>
          
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">
                Password:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                required
              />
            </div>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="login-btn"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <div className="help-text">
            Admin access required
          </div>
        </div>
      </div>
    </>
  )
}