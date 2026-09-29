import { useCallback, useEffect, useState } from 'react'
import { doctorService, mappingService, patientService } from '../services/api'

export function DashboardPage({ onNavigate }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  const loadSummary = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [patients, doctors, mappings] = await Promise.all([
        patientService.list(), doctorService.list(), mappingService.list(),
      ])
      setSummary({ patients, doctors, mappings })
    } catch (requestError) {
      setError(requestError.message || 'Could not load the dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadSummary() }, [loadSummary, reload])

  return <>
    <div className="welcome-row"><div><h2>Your care operations at a glance</h2><p>Counts below reflect records currently available to your account.</p></div><button className="secondary-button" onClick={() => setReload((value) => value + 1)} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button></div>
    {error && <div className="error-message page-alert" role="alert">{error}<button className="text-button" onClick={() => setReload((value) => value + 1)}>Try again</button></div>}
    <div className="metric-grid" aria-live="polite">
      {[
        ['Patients', summary?.patients.length, 'Your patient records', 'patients'],
        ['Doctors', summary?.doctors.length, 'Available in the directory', 'doctors'],
        ['Care assignments', summary?.mappings.length, 'For your patients', 'mappings'],
      ].map(([label, value, note, target]) => <button className="metric-card metric-card-button" key={label} onClick={() => onNavigate(target)} disabled={loading}>
        <span className="metric-label">{label}</span><strong>{loading ? '—' : value ?? '—'}</strong><span>{loading ? 'Loading records…' : note}</span>
      </button>)}
    </div>
    <div className="content-grid">
      <article className="panel"><div className="panel-heading"><div><h2>Workspace status</h2><p>Live API-backed totals for this account.</p></div></div>
        {loading ? <div className="inline-loading" role="status">Loading your workspace…</div> : error ? <p className="muted-copy">Dashboard data is temporarily unavailable.</p> : <div className="summary-list"><p><span>Patients you manage</span><strong>{summary.patients.length}</strong></p><p><span>Doctors in directory</span><strong>{summary.doctors.length}</strong></p><p><span>Care assignments</span><strong>{summary.mappings.length}</strong></p></div>}
      </article>
      <article className="panel quick-actions"><div className="panel-heading"><div><h2>Quick access</h2><p>Open a workspace area.</p></div></div><button onClick={() => onNavigate('patients')}>Manage patients <span>→</span></button><button onClick={() => onNavigate('doctors')}>Browse doctors <span>→</span></button><button onClick={() => onNavigate('mappings')}>View assignments <span>→</span></button></article>
    </div>
  </>
}
