import { useState } from 'react'
import { DashboardPage } from '../pages/DashboardPage'
import { DirectoryPage } from '../pages/DirectoryPage'

const navigation = [
  { id: 'dashboard', label: 'Overview', icon: '⌂' },
  { id: 'patients', label: 'Patients', icon: '◉' },
  { id: 'doctors', label: 'Doctors', icon: '✚' },
  { id: 'mappings', label: 'Care assignments', icon: '↔' },
]

export function DashboardLayout({ userEmail, onLogout }) {
  const [section, setSection] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const activeItem = navigation.find((item) => item.id === section)
  const selectSection = (id) => { setSection(id); setSidebarOpen(false) }

  return <div className="app-shell">
    <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`} aria-label="Primary navigation">
      <div className="brand"><span className="brand-mark">W</span><span>WhatBytes <b>Health</b></span></div>
      <nav>{navigation.map((item) => <button key={item.id} className={`nav-link ${section === item.id ? 'active' : ''}`} onClick={() => selectSection(item.id)}><span aria-hidden="true">{item.icon}</span>{item.label}</button>)}</nav>
      <div className="sidebar-footer"><p>HEALTHCARE WORKSPACE</p><span>Connected to your account</span></div>
    </aside>
    {sidebarOpen && <button className="scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
    <main className="main-content">
      <header className="topbar">
        <button className="menu-button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}>☰</button>
        <div><p className="eyebrow">HEALTHCARE ADMINISTRATION</p><h1>{activeItem.label}</h1></div>
        <div className="user-menu"><span className="avatar" aria-hidden="true">{(userEmail || 'U').slice(0, 1).toUpperCase()}</span><span className="user-name">{userEmail || 'Signed in'}</span><button className="logout-button" onClick={onLogout}>Log out</button></div>
      </header>
      <section className="page-content">
        {section === 'dashboard' && <DashboardPage onNavigate={selectSection} />}
        {section !== 'dashboard' && <DirectoryPage section={section} />}
      </section>
    </main>
  </div>
}
