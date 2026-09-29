import { useState } from 'react'

export function AuthPage({ mode, onModeChange, onSubmit, notice = '' }) {
  const isLogin = mode === 'login'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSubmit(mode, form)
    } catch (requestError) {
      setError(requestError.message || 'Unable to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return <main className="auth-page">
    <section className="auth-intro">
      <div className="brand"><span className="brand-mark">W</span><span>WhatBytes <b>Health</b></span></div>
      <div className="intro-copy"><p className="eyebrow">CARE, COORDINATED</p><h1>One calm place to manage care teams.</h1><p>Patient records, clinician directories and care assignments will live here as the platform is built.</p></div>
      <p className="phase-note">Secure access for your care operations team.</p>
    </section>
    <section className="auth-panel">
      <form className="auth-card" onSubmit={submit}>
        <p className="eyebrow">{isLogin ? 'WELCOME BACK' : 'GET STARTED'}</p>
        <h2>{isLogin ? 'Sign in to your workspace' : 'Create your workspace account'}</h2>
        {notice && <p className="notice-message" role="status">{notice}</p>}
        {error && <p className="error-message" role="alert">{error}</p>}
        {!isLogin && <label>Full name<input name="name" type="text" value={form.name} onChange={change} placeholder="Anosh Mishra" autoComplete="name" required /></label>}
        <label>Work email<input name="email" type="email" value={form.email} onChange={change} placeholder="anosh@clinic.org" autoComplete="email" required /></label>
        <label>Password<input name="password" type="password" value={form.password} onChange={change} placeholder="At least 8 characters" autoComplete={isLogin ? 'current-password' : 'new-password'} minLength={8} required /></label>
        <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}</button>
        <p className="auth-switch">{isLogin ? 'New to WhatBytes Health?' : 'Already have an account?'} <button type="button" onClick={() => onModeChange(isLogin ? 'register' : 'login')}>{isLogin ? 'Register' : 'Sign in'}</button></p>
      </form>
    </section>
  </main>
}
