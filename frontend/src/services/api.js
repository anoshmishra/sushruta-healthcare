const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''
export const API_BASE_URL = configuredBaseUrl.replace(/\/+$/, '')

const SESSION_KEY = 'whatbytes-healthcare-session'

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export function getSession() {
  try {
    const value = sessionStorage.getItem(SESSION_KEY)
    if (!value) return null
    const session = JSON.parse(value)
    const payload = session.access?.split('.')[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const claims = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')))
    if (!claims.exp || claims.exp * 1000 <= Date.now()) {
      clearSession()
      return null
    }
    return session
  } catch {
    return null
  }
}

export function saveSession(tokens, email = '') {
  const session = { ...tokens, email }
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    throw new ApiError('This browser could not store the sign-in session. Please enable session storage and try again.')
  }
  return session
}

export function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // The app still switches to the signed-out view if storage is unavailable.
  }
}

function flattenErrors(value, prefix = '') {
  if (typeof value === 'string') return [prefix ? `${prefix}: ${value}` : value]
  if (Array.isArray(value)) return value.flatMap((item) => flattenErrors(item, prefix))
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => flattenErrors(item, key === 'non_field_errors' ? '' : key))
  }
  return []
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = new Headers({ Accept: 'application/json' })
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  if (auth) {
    const access = getSession()?.access
    if (access) headers.set('Authorization', `Bearer ${access}`)
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(`Could not connect to the API${API_BASE_URL ? ` at ${API_BASE_URL}` : ''}. Check your connection and API configuration.`)
  }

  if (response.status === 204) return null
  const contentType = response.headers.get('content-type') ?? ''
  const data = contentType.includes('application/json') ? await response.json().catch(() => null) : null

  if (!response.ok) {
    if (auth && response.status === 401) {
      clearSession()
      window.dispatchEvent(new CustomEvent('whatbytes:session-expired'))
    }
    const errors = flattenErrors(data)
    const message = errors.join(' · ') || `The request failed (${response.status}). Please try again.`
    throw new ApiError(message, response.status, data)
  }

  return data
}

const get = (path) => request(path)
const post = (path, body) => request(path, { method: 'POST', body })
const put = (path, body) => request(path, { method: 'PUT', body })
const del = (path) => request(path, { method: 'DELETE' })

export const authService = {
  async register(details) {
    return request('/api/auth/register/', { method: 'POST', body: details, auth: false })
  },
  async login(credentials) {
    return request('/api/auth/login/', { method: 'POST', body: credentials, auth: false })
  },
}

export const patientService = {
  list: () => get('/api/patients/'),
  get: (id) => get(`/api/patients/${id}/`),
  create: (patient) => post('/api/patients/', patient),
  update: (id, patient) => put(`/api/patients/${id}/`, patient),
  remove: (id) => del(`/api/patients/${id}/`),
}

export const doctorService = {
  list: () => get('/api/doctors/'),
  get: (id) => get(`/api/doctors/${id}/`),
  create: (doctor) => post('/api/doctors/', doctor),
  update: (id, doctor) => put(`/api/doctors/${id}/`, doctor),
  remove: (id) => del(`/api/doctors/${id}/`),
}

export const mappingService = {
  list: () => get('/api/mappings/'),
  doctorsForPatient: (patientId) => get(`/api/mappings/${patientId}/`),
  create: (mapping) => post('/api/mappings/', mapping),
  remove: (id) => del(`/api/mappings/${id}/`),
}
