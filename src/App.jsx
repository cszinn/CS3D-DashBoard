import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { RealTimeProvider } from './context/RealTimeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Calculator from './pages/Calculator'
import Login from './pages/Login'
import Register from './pages/Register'
import './App.css'

function DashboardLayout() {
  return (
    <RealTimeProvider>
      <div className="app-layout" style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
        <Sidebar />
        <main className="main-content" style={{ flex: 1, padding: '2rem', height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calculadora" element={<Calculator />} />
          </Routes>
        </main>
      </div>
    </RealTimeProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
