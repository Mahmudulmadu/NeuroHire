import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from './AuthContext'

export function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (isSignUp) {
      const err = await signUp(email, password)
      if (err) setError(err)
      else setSuccess('Check your email to confirm your account.')
    } else {
      const err = await signIn(email, password)
      if (err) setError(err)
    }

    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__brand">
          <div className="auth-card__logo">N</div>
          <h1 className="auth-card__title">NeuroHire</h1>
          <p className="auth-card__subtitle">AI-Powered Resume Intelligence</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h2 className="auth-form__heading">{isSignUp ? 'Create Account' : 'Sign In'}</h2>

          <div className="field">
            <label className="field__label">Email</label>
            <input
              className="field__input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="field">
            <label className="field__label">Password</label>
            <input
              className="field__input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && <div className="auth-form__error">{error}</div>}
          {success && <div className="auth-form__success">{success}</div>}

          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="auth-card__toggle">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" className="auth-link" onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccess(null) }}>
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  )
}
