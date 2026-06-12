import { useState } from 'react'
import { supabase } from '../lib/supabase'
import styles from './Auth.module.css'

export default function Auth() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email for a confirmation link.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }

    setLoading(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="10" fill="#7C3AED" />
            <path d="M9 16.5L13.5 21L23 11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 className={styles.title}>
          {mode === 'signin' ? 'Welcome back' : 'Create account'}
        </h1>
        <p className={styles.subtitle}>
          {mode === 'signin'
            ? 'Sign in to access your tasks'
            : 'Start tracking what matters'}
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className={styles.input}
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {message && <p className={styles.success}>{message}</p>}

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              mode === 'signin' ? 'Sign in' : 'Create account'
            )}
          </button>
        </form>

        <p className={styles.toggle}>
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
          {' '}
          <button
            className={styles.toggleBtn}
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setMessage(null) }}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
