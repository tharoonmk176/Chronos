import { useState } from 'react'
import { login, register } from '../api/client'

export default function AuthPanel({ onAuthenticated }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (mode === 'register') {
        await register(email, password)
      }
      await login(email, password)
      onAuthenticated()
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chart-card" style={{ maxWidth: 360, margin: '40px auto' }}>
      <h3>{mode === 'login' ? 'Log In' : 'Create Account'}</h3>
      <form className="backtest-form" style={{ gridTemplateColumns: '1fr' }} onSubmit={submit}>
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Working…' : mode === 'login' ? 'Log In' : 'Register & Log In'}
        </button>
      </form>
      {error && <div className="error-banner">{error}</div>}
      <p className="muted" style={{ marginTop: 10 }}>
        {mode === 'login' ? "Don't have an account? " : 'Already registered? '}
        <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === 'login' ? 'register' : 'login') }}>
          {mode === 'login' ? 'Register' : 'Log in'}
        </a>
      </p>
    </div>
  )
}
