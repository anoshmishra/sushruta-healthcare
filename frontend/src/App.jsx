import { useEffect, useState } from 'react'
import { AuthPage } from './pages/AuthPage'
import { DashboardLayout } from './components/DashboardLayout'
import { authService, clearSession, getSession, saveSession } from './services/api'

export default function App() {
  const [screen, setScreen] = useState('login')
  const [session, setSession] = useState(() => getSession())
  const [authNotice, setAuthNotice] = useState('')

  useEffect(() => {
    const handleExpired = () => {
      setSession(null)
      setScreen('login')
      setAuthNotice('Your session expired. Sign in again to continue.')
    }
    window.addEventListener('whatbytes:session-expired', handleExpired)
    return () => window.removeEventListener('whatbytes:session-expired', handleExpired)
  }, [])

  const submitAuth = async (mode, details) => {
    if (mode === 'register') await authService.register(details)
    const tokens = await authService.login({ email: details.email, password: details.password })
    const newSession = saveSession(tokens, details.email)
    setSession(newSession)
    setScreen('dashboard')
    setAuthNotice('')
  }

  const logOut = () => {
    clearSession()
    setSession(null)
    setScreen('login')
    setAuthNotice('You have been signed out.')
  }

  return session?.access
    ? <DashboardLayout userEmail={session.email} onLogout={logOut} />
    : <AuthPage mode={screen} onModeChange={(mode) => { setAuthNotice(''); setScreen(mode) }} onSubmit={submitAuth} notice={authNotice} />
}
