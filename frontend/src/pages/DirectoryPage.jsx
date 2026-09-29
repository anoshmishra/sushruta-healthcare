import { useCallback, useEffect, useRef, useState } from 'react'
import { doctorService, mappingService, patientService } from '../services/api'
import { medicalDepartments } from '../data/medicalSpecialties'

const pageInfo = {
  patients: { title: 'Patients', description: 'Patient records are visible only to the account that created them.', action: 'Add patient' },
  doctors: { title: 'Doctors', description: 'The shared clinician directory for your care team.', action: 'Add doctor' },
  mappings: { title: 'Care assignments', description: 'Connect your patients with clinicians in the directory.', action: 'Create assignment' },
}

const emptyForm = {
  patients: { name: '', date_of_birth: '', gender: '', phone: '', email: '', address: '', care_department: '', primary_concern: '', medical_notes: '' },
  doctors: { name: '', department: '', specialization: '', email: '', phone: '', address: '' },
  mappings: { patient: '', doctor: '' },
}

export function DirectoryPage({ section }) {
  const page = pageInfo[section]
  const [records, setRecords] = useState([])
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [reload, setReload] = useState(0)
  const [dialog, setDialog] = useState(null)
  const [form, setForm] = useState(emptyForm[section])
  const [lookupPatient, setLookupPatient] = useState('')
  const [assignedDoctors, setAssignedDoctors] = useState(null)
  const [lookupLoading, setLookupLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (section === 'patients') {
        setRecords(await patientService.list())
      } else if (section === 'doctors') {
        setRecords(await doctorService.list())
      } else {
        const [mappingRows, patientRows, doctorRows] = await Promise.all([
          mappingService.list(), patientService.list(), doctorService.list(),
        ])
        setRecords(mappingRows)
        setPatients(patientRows)
        setDoctors(doctorRows)
      }
    } catch (requestError) {
      setError(requestError.message || `Could not load ${page.title.toLowerCase()}.`)
    } finally {
      setLoading(false)
    }
  }, [page.title, section])

  useEffect(() => { load() }, [load, reload])

  const openForm = (record = null) => {
    setError('')
    setForm(record ? { ...emptyForm[section], ...record } : emptyForm[section])
    setDialog({ type: record ? 'edit' : 'create', record })
  }

  const openDetails = async (record) => {
    setError('')
    setDialog({ type: 'view', record, loading: true })
    try {
      const fullRecord = section === 'patients' ? await patientService.get(record.id) : await doctorService.get(record.id)
      setDialog({ type: 'view', record: fullRecord, loading: false })
    } catch (requestError) {
      setDialog(null)
      setError(requestError.message || 'Could not load this record.')
    }
  }

  const saveRecord = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      if (section === 'mappings') {
        await mappingService.create({ patient: Number(form.patient), doctor: Number(form.doctor) })
        setFeedback('Care assignment created.')
      } else if (dialog.type === 'edit') {
        const payload = recordPayload(section, form)
        if (section === 'patients') await patientService.update(dialog.record.id, payload)
        else await doctorService.update(dialog.record.id, payload)
        setFeedback(`${page.title.slice(0, -1)} updated.`)
      } else {
        const payload = recordPayload(section, form)
        if (section === 'patients') await patientService.create(payload)
        else await doctorService.create(payload)
        setFeedback(`${page.title.slice(0, -1)} added.`)
      }
      setDialog(null)
      setForm(emptyForm[section])
      setReload((value) => value + 1)
    } catch (requestError) {
      setError(requestError.message || 'Please review the form and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteRecord = async (record) => {
    const description = section === 'mappings'
      ? 'this care assignment'
      : `${section === 'patients' ? 'patient' : 'doctor'} “${record.name}”`
    if (!window.confirm(`Delete ${description}? This action cannot be undone.`)) return
    setError('')
    setFeedback('')
    try {
      if (section === 'patients') await patientService.remove(record.id)
      else if (section === 'doctors') await doctorService.remove(record.id)
      else await mappingService.remove(record.id)
      setFeedback('Record deleted.')
      setReload((value) => value + 1)
    } catch (requestError) {
      setError(requestError.message || 'Could not delete this record.')
    }
  }

  const viewAssignedDoctors = async (event) => {
    event.preventDefault()
    if (!lookupPatient) return
    setLookupLoading(true)
    setError('')
    try {
      setAssignedDoctors(await mappingService.doctorsForPatient(lookupPatient))
    } catch (requestError) {
      setError(requestError.message || 'Could not load assigned doctors.')
      setAssignedDoctors(null)
    } finally {
      setLookupLoading(false)
    }
  }

  const patientsById = Object.fromEntries(patients.map((item) => [item.id, item]))
  const doctorsById = Object.fromEntries(doctors.map((item) => [item.id, item]))
  const selectedPatient = patients.find((patient) => String(patient.id) === String(form.patient))
  const recommendedDoctors = selectedPatient?.care_department
    ? doctors.filter((doctor) => doctor.department === selectedPatient.care_department)
    : []

  return <div className="directory-page">
    <div className="directory-heading"><div><h2>{page.title}</h2><p>{page.description}</p></div><button className="primary-button compact-button" type="button" onClick={() => openForm()} disabled={loading}>{page.action}</button></div>
    {feedback && <p className="success-message page-alert" role="status">{feedback}<button className="dismiss-button" aria-label="Dismiss message" onClick={() => setFeedback('')}>×</button></p>}
    {error && <p className="error-message page-alert" role="alert">{error}<button className="dismiss-button" aria-label="Dismiss error" onClick={() => setError('')}>×</button></p>}

    {section === 'mappings' && !loading && <>
      <form className="panel mapping-create" onSubmit={saveRecord}>
        <div><h3>Assign a doctor</h3><p>Create an assignment between one of your patients and a doctor.</p></div>
        <label>Patient<select value={form.patient} onChange={(event) => setForm((current) => ({ ...current, patient: event.target.value, doctor: '' }))} required><option value="">Select a patient</option>{patients.map((patient) => <option value={patient.id} key={patient.id}>{recordNumber('PAT', patient.id)} · {patient.name}</option>)}</select></label>
        <label>Doctor<select value={form.doctor} onChange={(event) => setForm((current) => ({ ...current, doctor: event.target.value }))} required><option value="">Select a doctor</option>{recommendedDoctors.length > 0 && <optgroup label={`Suggested · ${selectedPatient.care_department}`}>{recommendedDoctors.map((doctor) => <option value={doctor.id} key={doctor.id}>{recordNumber('DOC', doctor.id)} · Dr. {doctor.name} · {doctor.specialization}</option>)}</optgroup>}{doctors.length > recommendedDoctors.length && <optgroup label={recommendedDoctors.length ? 'Other doctors' : 'All doctors'}>{doctors.filter((doctor) => !recommendedDoctors.includes(doctor)).map((doctor) => <option value={doctor.id} key={doctor.id}>{recordNumber('DOC', doctor.id)} · Dr. {doctor.name} · {doctor.specialization}</option>)}</optgroup>}</select></label>
        {selectedPatient && <div className="assignment-context"><strong>Patient referral context</strong><span>Patient number: {recordNumber('PAT', selectedPatient.id)}</span><span>Care department: {selectedPatient.care_department || 'Not specified'}</span><span>Primary concern: {selectedPatient.primary_concern || 'Not specified'}</span><small>{recommendedDoctors.length ? 'Suggested doctors match the selected care department. Confirm the assignment with the care team.' : 'No department-matched doctors are available; review the patient concern and choose the appropriate clinician.'}</small></div>}
        <button className="primary-button compact-button" type="submit" disabled={submitting || patients.length === 0 || doctors.length === 0}>{submitting ? 'Assigning…' : 'Assign doctor'}</button>
        {(patients.length === 0 || doctors.length === 0) && <p className="muted-copy form-hint">Add at least one patient and one doctor before creating an assignment.</p>}
      </form>
      <form className="panel assigned-lookup" onSubmit={viewAssignedDoctors}>
        <div><h3>Doctors assigned to a patient</h3><p>View the current assignments for one of your patients.</p></div>
        <label className="lookup-control">Patient<select value={lookupPatient} onChange={(event) => { setLookupPatient(event.target.value); setAssignedDoctors(null) }} required><option value="">Select a patient</option>{patients.map((patient) => <option value={patient.id} key={patient.id}>{recordNumber('PAT', patient.id)} · {patient.name}</option>)}</select></label>
        <button className="secondary-button" type="submit" disabled={lookupLoading || !lookupPatient}>{lookupLoading ? 'Loading…' : 'View doctors'}</button>
        {assignedDoctors && <div className="lookup-results" role="status">{assignedDoctors.length ? assignedDoctors.map((doctor) => <span key={doctor.id}>{recordNumber('DOC', doctor.id)} · Dr. {doctor.name} · {doctor.specialization}</span>) : <span>No doctors are assigned to this patient yet.</span>}</div>}
      </form>
    </>}

    <article className="panel table-panel"><div className="table-toolbar"><p className="table-title">{section === 'mappings' ? 'Current assignments' : `${page.title} directory`}</p><span className="record-count">{loading ? 'Loading…' : `${records.length} ${records.length === 1 ? 'record' : 'records'}`}</span></div>
      {loading ? <div className="inline-loading" role="status">Loading {page.title.toLowerCase()}…</div> : error && records.length === 0 ? <div className="empty-state"><h3>Data could not be loaded</h3><p>Check that the API is available, then try again.</p><button className="secondary-button" onClick={() => setReload((value) => value + 1)}>Try again</button></div> : records.length === 0 ? <div className="empty-state"><span aria-hidden="true">○</span><h3>No {page.title.toLowerCase()} yet</h3><p>{section === 'mappings' ? 'Create an assignment after adding a patient and a doctor.' : `Add your first ${section === 'patients' ? 'patient' : 'doctor'} to get started.`}</p></div> : <div className="table-wrap"><table><thead><tr>{section === 'patients' ? <><th>Patient</th><th>Date of birth</th><th>Contact</th><th>Actions</th></> : section === 'doctors' ? <><th>Doctor</th><th>Department</th><th>Specialization</th><th>Contact</th><th>Actions</th></> : <><th>Patient</th><th>Assigned doctor</th><th>Assignment</th><th>Actions</th></>}</tr></thead>
        <tbody>{records.map((record) => <tr key={record.id}>
          {section === 'patients' && <><td><strong>{record.name}</strong><small className="table-subline">{recordNumber('PAT', record.id)}</small>{record.primary_concern && <small className="table-subline">Concern: {record.primary_concern}</small>}</td><td>{record.date_of_birth}</td><td>{record.phone}{record.email && <small className="table-subline">{record.email}</small>}</td><td><RowActions onView={() => openDetails(record)} onEdit={() => openForm(record)} onDelete={() => deleteRecord(record)} /></td></>}
          {section === 'doctors' && <><td><strong>Dr. {record.name}</strong><small className="table-subline">{recordNumber('DOC', record.id)}</small><small className="table-subline">{record.email}</small></td><td>{record.department}</td><td>{record.specialization}</td><td>{record.phone}</td><td><RowActions onView={() => openDetails(record)} onEdit={() => openForm(record)} onDelete={() => deleteRecord(record)} /></td></>}
          {section === 'mappings' && <><td><strong>{patientsById[record.patient]?.name ?? recordNumber('PAT', record.patient)}</strong><small className="table-subline">{recordNumber('PAT', record.patient)}</small>{patientsById[record.patient]?.primary_concern && <small className="table-subline">Concern: {patientsById[record.patient].primary_concern}</small>}</td><td><strong>{doctorsById[record.doctor] ? `Dr. ${doctorsById[record.doctor].name}` : recordNumber('DOC', record.doctor)}</strong><small className="table-subline">{recordNumber('DOC', record.doctor)}</small></td><td><small>{recordNumber('ASN', record.id)}</small><small className="table-subline">{new Date(record.created_at).toLocaleDateString()}</small></td><td><button className="row-action danger-text" onClick={() => deleteRecord(record)}>Remove</button></td></>}
        </tr>)}</tbody></table></div>}
    </article>

    {dialog && <RecordDialog title={dialog.type === 'view' ? `${section === 'patients' ? 'Patient' : 'Doctor'} details` : dialog.type === 'edit' ? `Edit ${section === 'patients' ? 'patient' : 'doctor'}` : page.action} onClose={() => setDialog(null)}>
      {dialog.type === 'view' ? dialog.loading ? <div className="inline-loading" role="status">Loading details…</div> : <dl className="detail-list">{Object.entries(dialog.record).filter(([key]) => key !== 'created_by').map(([key, value]) => <div key={key}><dt>{formatLabel(key)}</dt><dd>{key === 'id' ? recordNumber(section === 'patients' ? 'PAT' : 'DOC', value) : value || '—'}</dd></div>)}</dl> : <form onSubmit={saveRecord} className="record-form">
        {section === 'patients' ? <>
          <label>Full name<input name="name" value={form.name} onChange={changeField(setForm)} required maxLength={150} /></label>
          <label>Date of birth<input name="date_of_birth" type="date" value={form.date_of_birth} onChange={changeField(setForm)} required /></label>
          <label>Gender<select name="gender" value={form.gender} onChange={changeField(setForm)} required><option value="">Select gender</option><option value="female">Female</option><option value="male">Male</option><option value="non_binary">Non-binary</option><option value="prefer_not_to_say">Prefer not to say</option></select></label>
          <label>Phone<input name="phone" type="tel" value={form.phone} onChange={changeField(setForm)} required maxLength={25} /></label>
          <label>Email <span className="optional-label">Optional</span><input name="email" type="email" value={form.email} onChange={changeField(setForm)} /></label>
          <label>Care department <span className="optional-label">Optional · helps route to a doctor</span><select name="care_department" value={form.care_department} onChange={changeField(setForm)}><option value="">Select care department</option>{medicalDepartments.map(({ name }) => <option value={name} key={name}>{name}</option>)}</select></label>
          <label>Primary condition or reason for visit <span className="optional-label">Optional</span><input name="primary_concern" value={form.primary_concern} onChange={changeField(setForm)} maxLength={200} placeholder="e.g. persistent joint pain" /></label>
          <label>Relevant medical notes <span className="optional-label">Optional</span><textarea name="medical_notes" value={form.medical_notes} onChange={changeField(setForm)} rows="3" placeholder="Add relevant referral context for the care team" /></label>
          <label>Address <span className="optional-label">Optional</span><textarea name="address" value={form.address} onChange={changeField(setForm)} rows="2" /></label>
        </> : <>
          <label>Full name<input name="name" value={form.name} onChange={changeField(setForm)} required maxLength={150} /></label>
          <label>Department<select name="department" value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value, specialization: '' }))} required><option value="">Select department</option>{medicalDepartments.map(({ name }) => <option key={name} value={name}>{name}</option>)}</select></label>
          <label>Specialization<select name="specialization" value={form.specialization} onChange={changeField(setForm)} required disabled={!form.department}><option value="">{form.department ? 'Select specialization' : 'Select a department first'}</option>{medicalDepartments.find(({ name }) => name === form.department)?.specialties.map((specialty) => <option key={specialty} value={specialty}>{specialty}</option>)}{form.specialization && !medicalDepartments.find(({ name }) => name === form.department)?.specialties.includes(form.specialization) && <option value={form.specialization}>{form.specialization}</option>}</select></label>
          <label>Email<input name="email" type="email" value={form.email} onChange={changeField(setForm)} required /></label>
          <label>Phone<input name="phone" type="tel" value={form.phone} onChange={changeField(setForm)} required maxLength={25} /></label>
          <label>Address <span className="optional-label">Optional</span><textarea name="address" value={form.address} onChange={changeField(setForm)} rows="2" /></label>
        </>}
        {error && <p className="error-message" role="alert">{error}</p>}
        <div className="dialog-actions"><button className="secondary-button" type="button" onClick={() => setDialog(null)}>Cancel</button><button className="primary-button compact-button" type="submit" disabled={submitting}>{submitting ? 'Saving…' : dialog.type === 'edit' ? 'Save changes' : 'Add record'}</button></div>
      </form>}
    </RecordDialog>}
  </div>
}

function changeField(setForm) {
  return (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
}

function recordPayload(section, form) {
  const fields = section === 'patients'
    ? ['name', 'date_of_birth', 'gender', 'phone', 'email', 'address', 'care_department', 'primary_concern', 'medical_notes']
    : ['name', 'department', 'specialization', 'email', 'phone', 'address']
  return Object.fromEntries(fields.map((field) => [field, form[field] ?? '']))
}

function recordNumber(prefix, id) {
  return `${prefix}-${String(id).padStart(6, '0')}`
}

function formatLabel(value) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function RowActions({ onView, onEdit, onDelete }) {
  return <div className="row-actions"><button className="row-action" onClick={onView}>View</button><button className="row-action" onClick={onEdit}>Edit</button><button className="row-action danger-text" onClick={onDelete}>Delete</button></div>
}

function RecordDialog({ title, onClose, children }) {
  const closeRef = useRef(null)
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  useEffect(() => {
    const previouslyFocused = document.activeElement
    closeRef.current?.focus()
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])')]
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (previouslyFocused?.isConnected) previouslyFocused.focus()
    }
  }, [])

  return <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section ref={dialogRef} className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <header className="dialog-header"><h2 id="dialog-title">{title}</h2><button ref={closeRef} className="dismiss-button" aria-label="Close dialog" onClick={onClose}>×</button></header>
      {children}
    </section>
  </div>
}
