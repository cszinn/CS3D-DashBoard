import { useState } from 'react'
import { RealTimeProvider } from './context/RealTimeContext'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  return (
    <RealTimeProvider>
      <div className="app-layout" style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
        <Sidebar />
        <main className="main-content" style={{ flex: 1, padding: '2rem', height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Aqui iríamos colocar um Header superior se necessário, mas por enquanto vamos renderizar o Dashboard direto */}
          <Dashboard />
        </main>
      </div>
    </RealTimeProvider>
  )
}

export default App
